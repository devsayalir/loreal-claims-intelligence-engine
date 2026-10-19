import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertTransition } from './claim-status.js';
import { AttachEvidenceDto } from './dto/attach-evidence.dto.js';
import { CreateClaimDto } from './dto/create-claim.dto.js';
import { ReviewClaimDto } from './dto/review-claim.dto.js';
import { SubmitFormulaDto } from './dto/submit-formula.dto.js';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClaimDto) {
    return this.prisma.claim.create({ data: dto });
  }

  findAll(status?: ClaimStatus) {
    return this.prisma.claim.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { assessments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async findOne(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: { assessments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!claim) throw new NotFoundException(`Claim ${id} not found`);
    return claim;
  }

  async review(id: string, dto: ReviewClaimDto) {
    const claim = await this.findOne(id);
    const next =
      dto.decision === 'APPROVE' ? ClaimStatus.APPROVED : ClaimStatus.REJECTED;

    if (next === ClaimStatus.REJECTED && !dto.note?.trim()) {
      throw new BadRequestException('A note is required when rejecting');
    }
    assertTransition(claim.status, next);

    return this.prisma.claim.update({
      where: { id },
      data: { status: next, reviewNote: dto.note?.trim() || null },
    });
  }

  async submitFormula(id: string, dto: SubmitFormulaDto) {
    const claim = await this.findOne(id);
    assertTransition(claim.status, ClaimStatus.FORMULA_SUBMITTED);

    return this.prisma.claim.update({
      where: { id },
      data: {
        formulaReference: dto.formulaReference,
        formulaDetails: dto.formulaDetails,
        status: ClaimStatus.FORMULA_SUBMITTED,
      },
    });
  }

  async attachEvidence(id: string, dto: AttachEvidenceDto) {
    const claim = await this.findOne(id);
    assertTransition(claim.status, ClaimStatus.EVIDENCE_ATTACHED);

    return this.prisma.claim.update({
      where: { id },
      data: {
        studyDesign: dto.studyDesign,
        sampleSize: dto.sampleSize ?? null,
        studyDuration: dto.studyDuration ?? null,
        evidenceText: dto.evidenceText,
        status: ClaimStatus.EVIDENCE_ATTACHED,
      },
    });
  }
}
