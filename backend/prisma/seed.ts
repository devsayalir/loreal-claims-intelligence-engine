import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  if (
    process.env.SEED_ONLY_IF_EMPTY === 'true' &&
    (await prisma.claim.count())
  ) {
    console.log('Database already has claims, skipping seed');
    return;
  }

  await prisma.assessment.deleteMany();
  await prisma.claim.deleteMany();

  await prisma.claim.createMany({
    data: [
      {
        productName: 'Revitalift Laser Night Cream',
        claimText: 'Visibly reduces wrinkles by 20% in 4 weeks',
        claimType: 'EFFICACY',
        proposedBy: 'Skincare Marketing - Paris',
        status: 'PROPOSED',
      },
      {
        productName: 'Elvive Hydra Hyaluronic Shampoo',
        claimText: 'Hair is 2x more hydrated after one wash',
        claimType: 'EFFICACY',
        proposedBy: 'Haircare Marketing - Paris',
        status: 'FORMULA_SUBMITTED',
        reviewNote: 'Applicable to EU and UK. Instrumental proof required.',
        formulaReference: 'F-2026-0412',
        formulaDetails:
          'Sodium hyaluronate 0.1%, glycerin 3%, cationic guar, sulfate-free surfactant base.',
      },
      {
        productName: 'Age Perfect Cell Renewal Serum',
        claimText: 'Reduces the appearance of fine lines by 25% in 8 weeks',
        claimType: 'EFFICACY',
        proposedBy: 'Skincare Marketing - Paris',
        status: 'EVIDENCE_ATTACHED',
        reviewNote: 'Feasible. Needs a vehicle-controlled study.',
        formulaReference: 'F-2026-0377',
        formulaDetails:
          'Pro-retinol 0.3%, niacinamide 4%, hyaluronic acid 0.5%.',
        studyDesign:
          'Randomised, double-blind, vehicle-controlled split-face study',
        sampleSize: 64,
        studyDuration: '8 weeks',
        evidenceText:
          "Women aged 45-65. Crow's feet wrinkle depth measured by fringe projection (Primos). " +
          'Mean reduction in fine-line depth vs baseline: 14% at 4 weeks and 27% at 8 weeks ' +
          '(p<0.01 vs vehicle). No adverse events reported.',
      },
    ],
  });

  console.log('Seeded 3 claims');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
