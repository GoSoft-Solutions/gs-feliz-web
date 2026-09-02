import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Minimal local dev seed. Intentionally small: a single campaign that
 * matches the "guia-gratuita" example from docs/integrations/manychat.md,
 * so the ManyChat integration can be exercised locally without manually
 * creating a campaign first.
 */
async function main() {
  const campaign = await prisma.campaign.upsert({
    where: { slug: 'guia-gratuita' },
    update: {},
    create: {
      name: 'Guía Gratuita',
      slug: 'guia-gratuita',
      source: 'instagram',
      status: 'ACTIVE',
      emailSubject: 'Tu Guía Gratuita está lista',
      emailFromName: 'Daniel Corral',
      emailHtml:
        '<p>Hola {{nombre}},</p><p>Gracias por registrarte. Aquí tienes tu guía gratuita.</p><p><a href="https://danielcorral.com.mx">Descargar ahora</a></p><p>Un abrazo,<br/>Daniel</p>',
    },
  });

  // The single real contact for the demo: Israel (the user himself),
  // captured from Instagram via the "guia-gratuita" campaign.
  const email = 'jesus2102.garcia@gmail.com';
  const contact = await prisma.contact.upsert({
    where: { email },
    update: {},
    create: {
      email,
      firstName: 'Israel',
      lastName: 'Jesús',
      status: 'LEAD',
    },
  });

  await prisma.contactSource.upsert({
    where: { provider_externalId: { provider: 'LANDING', externalId: contact.id } },
    update: {},
    create: {
      contactId: contact.id,
      provider: 'LANDING',
      externalId: contact.id,
      source: 'instagram',
      campaignId: campaign.id,
    },
  });

  const hasEvent = await prisma.contactEvent.findFirst({ where: { contactId: contact.id } });
  if (!hasEvent) {
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        eventType: 'LEAD_CREATED',
        campaignId: campaign.id,
        source: 'instagram',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
