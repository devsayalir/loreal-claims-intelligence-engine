import { ConflictException } from '@nestjs/common';
import { ClaimStatus } from '../generated/prisma/client.js';

const TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  PROPOSED: [ClaimStatus.APPROVED, ClaimStatus.REJECTED],
  APPROVED: [ClaimStatus.FORMULA_SUBMITTED],
  REJECTED: [],
  FORMULA_SUBMITTED: [ClaimStatus.EVIDENCE_ATTACHED],
  // Evaluators can correct the evidence and re-run the assessment.
  EVIDENCE_ATTACHED: [ClaimStatus.EVIDENCE_ATTACHED, ClaimStatus.ASSESSED],
  ASSESSED: [ClaimStatus.EVIDENCE_ATTACHED, ClaimStatus.ASSESSED],
};

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ClaimStatus, to: ClaimStatus): void {
  if (!canTransition(from, to)) {
    throw new ConflictException(
      `A claim in status ${from} cannot move to ${to}`,
    );
  }
}
