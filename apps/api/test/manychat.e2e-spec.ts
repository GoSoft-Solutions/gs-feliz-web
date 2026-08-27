import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Full-flow e2e test for the ManyChat integration, run against a real
 * Postgres instance (see docker-compose.yml). Requires MANYCHAT_API_KEY
 * to be set — these tests are skipped automatically if it is not,
 * so `pnpm test:e2e` degrades gracefully in environments without a
 * database instead of failing with a confusing connection error.
 */
const API_KEY = process.env.MANYCHAT_API_KEY;
const describeIfConfigured = API_KEY ? describe : describe.skip;

describeIfConfigured('ManyChat integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let campaignSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Unique slug per test run so re-running the suite never collides
    // with leftover data from a previous run.
    campaignSlug = `e2e-test-campaign-${randomUUID().slice(0, 8)}`;
    await prisma.campaign.create({
      data: { name: 'E2E Test Campaign', slug: campaignSlug, status: 'ACTIVE' },
    });
  });

  afterAll(async () => {
    // Clean up everything this suite created, in FK-safe order.
    await prisma.contactEvent.deleteMany({ where: { campaign: { slug: campaignSlug } } });
    await prisma.contactSource.deleteMany({ where: { campaign: { slug: campaignSlug } } });
    const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
    if (campaign) {
      const sources = await prisma.contactSource.findMany({ where: { campaignId: campaign.id } });
      const contactIds = sources.map((s) => s.contactId);
      if (contactIds.length > 0) {
        await prisma.contactEvent.deleteMany({ where: { contactId: { in: contactIds } } });
        await prisma.contactSource.deleteMany({ where: { contactId: { in: contactIds } } });
        await prisma.contact.deleteMany({ where: { id: { in: contactIds } } });
      }
      await prisma.campaign.delete({ where: { id: campaign.id } });
    }
    await app.close();
  });

  it('creates a Contact, ContactSource, campaign association, and LEAD_CREATED event on first capture', async () => {
    const externalId = `e2e-${randomUUID()}`;

    const response = await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send({
        external_id: externalId,
        first_name: 'Test',
        email: `${externalId}@example.com`,
        source: 'instagram',
        campaign: campaignSlug,
      })
      .expect(200);

    expect(response.body).toMatchObject({ success: true, status: 'created' });

    const contactId = response.body.contact_id;
    const events = await prisma.contactEvent.findMany({ where: { contactId } });
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('LEAD_CREATED');

    const source = await prisma.contactSource.findUnique({
      where: { provider_externalId: { provider: 'MANYCHAT', externalId } },
    });
    expect(source).not.toBeNull();
    expect(source?.contactId).toBe(contactId);
  });

  it('is idempotent: a duplicate request with the same external_id updates instead of duplicating', async () => {
    const externalId = `e2e-dup-${randomUUID()}`;
    const payload = {
      external_id: externalId,
      email: `${externalId}@example.com`,
      campaign: campaignSlug,
    };

    const first = await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send(payload)
      .expect(200);

    const second = await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send(payload)
      .expect(200);

    expect(first.body.status).toBe('created');
    expect(second.body.status).toBe('updated');
    expect(first.body.contact_id).toBe(second.body.contact_id);

    const contactCount = await prisma.contact.count({ where: { id: first.body.contact_id } });
    expect(contactCount).toBe(1);

    const sourceCount = await prisma.contactSource.count({
      where: { provider: 'MANYCHAT', externalId },
    });
    expect(sourceCount).toBe(1);
  });

  it('resolves to the same Contact when the email already exists, even with a new external_id', async () => {
    const sharedEmail = `e2e-shared-${randomUUID()}@example.com`;

    const first = await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send({ external_id: `e2e-a-${randomUUID()}`, email: sharedEmail })
      .expect(200);

    const second = await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send({ external_id: `e2e-b-${randomUUID()}`, email: sharedEmail })
      .expect(200);

    expect(second.body.status).toBe('updated');
    expect(second.body.contact_id).toBe(first.body.contact_id);
  });

  it('rejects requests with an invalid API key', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', 'wrong-key')
      .send({ external_id: 'irrelevant' })
      .expect(401);
  });

  it('rejects requests missing the API key header entirely', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .send({ external_id: 'irrelevant' })
      .expect(401);
  });

  it('rejects an invalid payload (missing external_id) with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send({ email: 'no-external-id@example.com' })
      .expect(400);
  });

  it('rejects a malformed email in the payload with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/integrations/manychat/contacts')
      .set('X-API-Key', API_KEY!)
      .send({ external_id: `e2e-bademail-${randomUUID()}`, email: 'not-an-email' })
      .expect(400);
  });
});
