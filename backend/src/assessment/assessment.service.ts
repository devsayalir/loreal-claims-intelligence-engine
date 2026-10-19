import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { assertTransition } from '../claims/claim-status.js';
import { ClaimStatus, Prisma } from '../generated/prisma/client.js';
import {
  LLM_PROVIDER,
  type AssessmentInput,
  type LlmProvider,
  type LlmResult,
} from '../llm/llm-provider.js';
import { buildUserPrompt, PROMPT_VERSION } from '../llm/prompt.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssessClaimDto } from './dto/assess-claim.dto.js';

const assessmentSelect = {
  id: true,
  claimId: true,
  justified: true,
  confidenceScore: true,
  reasoning: true,
  provider: true,
  model: true,
  promptVersion: true,
  createdAt: true,
} satisfies Prisma.AssessmentSelect;

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async assess(dto: AssessClaimDto) {
    if (dto.claimId) return this.assessExistingClaim(dto.claimId);

    if (!dto.claim || !dto.evidence) {
      throw new BadRequestException(
        'Provide either claimId, or both claim and evidence',
      );
    }
    return this.assessInlineClaim(dto);
  }

  async findForClaim(claimId: string) {
    const exists = await this.prisma.claim.count({ where: { id: claimId } });
    if (!exists) throw new NotFoundException(`Claim ${claimId} not found`);

    return this.prisma.assessment.findMany({
      where: { claimId },
      orderBy: { createdAt: 'desc' },
      select: assessmentSelect,
    });
  }

  private async assessExistingClaim(claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });
    if (!claim) throw new NotFoundException(`Claim ${claimId} not found`);

    assertTransition(claim.status, ClaimStatus.ASSESSED);
    if (!claim.evidenceText) {
      throw new BadRequestException('The claim has no evidence attached');
    }

    const input: AssessmentInput = {
      ...claim,
      evidenceText: claim.evidenceText,
    };
    const result = await this.callLlm(input);

    const [assessment] = await this.prisma.$transaction([
      this.prisma.assessment.create({
        data: { claimId, ...this.toAssessmentData(input, result) },
        select: assessmentSelect,
      }),
      this.prisma.claim.update({
        where: { id: claimId },
        data: { status: ClaimStatus.ASSESSED },
      }),
    ]);
    return this.logSaved(assessment);
  }

  private async assessInlineClaim(dto: AssessClaimDto) {
    const { claim, evidence } = dto as Required<AssessClaimDto>;
    const input: AssessmentInput = {
      productName: claim.productName,
      claimText: claim.claimText,
      claimType: claim.claimType,
      studyDesign: evidence.studyDesign,
      sampleSize: evidence.sampleSize ?? null,
      studyDuration: evidence.studyDuration ?? null,
      evidenceText: evidence.evidenceText,
    };
    const result = await this.callLlm(input);

    // The claim is only stored once the model has answered, so a failed call
    // does not leave half-created records behind.
    const created = await this.prisma.claim.create({
      data: {
        productName: claim.productName,
        claimText: claim.claimText,
        claimType: claim.claimType,
        studyDesign: input.studyDesign,
        sampleSize: input.sampleSize,
        studyDuration: input.studyDuration,
        evidenceText: input.evidenceText,
        proposedBy: claim.proposedBy ?? 'Quick assess',
        status: ClaimStatus.ASSESSED,
        assessments: { create: this.toAssessmentData(input, result) },
      },
      select: { assessments: { select: assessmentSelect } },
    });
    return this.logSaved(created.assessments[0]);
  }

  private logSaved<
    T extends {
      id: string;
      claimId: string;
      justified: boolean;
      confidenceScore: number;
    },
  >(assessment: T): T {
    this.logger.log(
      `Saved assessment ${assessment.id} for claim ${assessment.claimId}: ` +
        `justified=${assessment.justified} confidence=${assessment.confidenceScore} provider=${this.llm.name}`,
    );
    return assessment;
  }

  private async callLlm(input: AssessmentInput): Promise<LlmResult> {
    try {
      return await this.llm.assess(input);
    } catch (err) {
      this.logger.error(`Assessment failed (${this.llm.name})`, err as Error);
      throw new BadGatewayException(
        'The assessment service did not return a usable answer. Please try again.',
      );
    }
  }

  private toAssessmentData(input: AssessmentInput, result: LlmResult) {
    return {
      justified: result.verdict.justified,
      confidenceScore: result.verdict.confidenceScore,
      reasoning: result.verdict.reasoning,
      evidenceSnapshot: buildUserPrompt(input),
      provider: this.llm.name,
      model: this.llm.model,
      promptVersion: PROMPT_VERSION,
      rawResponse: result.raw as Prisma.InputJsonValue,
    };
  }
}
