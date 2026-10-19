import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { LlmProvider } from '../llm/llm-provider.js';
import { MockProvider } from '../llm/mock.provider.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AssessmentService } from './assessment.service.js';

const storedClaim = {
  id: '6f1c1f4e-8d1b-4c39-9a35-0c4e1e1b2a10',
  productName: 'Age Perfect Serum',
  claimText: 'Reduces fine lines by 25% in 8 weeks',
  claimType: 'EFFICACY',
  status: 'EVIDENCE_ATTACHED',
  formulaDetails: 'Pro-retinol 0.3%',
  studyDesign: 'Vehicle-controlled',
  sampleSize: 64,
  studyDuration: '8 weeks',
  evidenceText: 'Fine-line depth reduced by 27% at 8 weeks (p<0.01).',
};

function createPrismaStub(claim: object | null = storedClaim) {
  return {
    claim: {
      findUnique: vi.fn().mockResolvedValue(claim),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          assessments: [{ id: 'a1', ...data.assessments.create }],
        }),
      ),
    },
    assessment: {
      create: vi
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ id: 'a1', ...data }),
        ),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

function createService(
  prisma = createPrismaStub(),
  llm: LlmProvider = new MockProvider(),
) {
  return {
    prisma,
    service: new AssessmentService(prisma as unknown as PrismaService, llm),
  };
}

describe('AssessmentService', () => {
  it('assesses a stored claim and marks it as assessed', async () => {
    const { service, prisma } = createService();

    const result = await service.assess({ claimId: storedClaim.id });

    expect(result.justified).toBe(true);
    expect(result.provider).toBe('mock');
    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: storedClaim.id },
      data: { status: 'ASSESSED' },
    });
  });

  it('stores the prompt version and evidence snapshot', async () => {
    const { service, prisma } = createService();

    await service.assess({ claimId: storedClaim.id });

    const data = prisma.assessment.create.mock.calls[0][0].data;
    expect(data.promptVersion).toBe('claims-v1');
    expect(data.evidenceSnapshot).toContain('27% at 8 weeks');
  });

  it('creates the claim and assessment together for inline requests', async () => {
    const { service, prisma } = createService();

    const result = await service.assess({
      claim: {
        productName: 'Revitalift',
        claimText: 'Reduces wrinkles by 20% in 4 weeks',
        claimType: 'EFFICACY',
      },
      evidence: {
        studyDesign: 'Open label',
        sampleSize: 40,
        evidenceText: 'Wrinkles reduced by 21% at 4 weeks.',
      },
    });

    expect(result.justified).toBe(true);
    const data = prisma.claim.create.mock.calls[0][0].data;
    expect(data.status).toBe('ASSESSED');
    expect(data.proposedBy).toBe('Quick assess');
  });

  it('requires claim and evidence when no claimId is given', async () => {
    const { service } = createService();
    await expect(service.assess({})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns 404 for an unknown claim', async () => {
    const { service } = createService(createPrismaStub(null));
    await expect(
      service.assess({ claimId: storedClaim.id }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to assess a claim that has no evidence yet', async () => {
    const { service } = createService(
      createPrismaStub({ ...storedClaim, status: 'APPROVED' }),
    );
    await expect(
      service.assess({ claimId: storedClaim.id }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps provider failures to a 502 and saves nothing', async () => {
    const failing: LlmProvider = {
      name: 'openai',
      model: 'gpt-4o-mini',
      assess: () => Promise.reject(new Error('timeout')),
    };
    const { service, prisma } = createService(createPrismaStub(), failing);

    await expect(
      service.assess({ claimId: storedClaim.id }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.assessment.create).not.toHaveBeenCalled();
  });
});
