import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Minimal local dev seed. Intentionally small: a single campaign that
 * matches the "guia-gratuita" example from docs/integrations/manychat.md,
 * so the ManyChat integration can be exercised locally without manually
 * creating a campaign first.
 */
async function main() {
  await prisma.campaign.upsert({
    where: { slug: 'guia-gratuita' },
    update: {},
    create: {
      name: 'Guía Gratuita',
      slug: 'guia-gratuita',
      source: 'instagram',
      status: 'ACTIVE',
    },
  });
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
