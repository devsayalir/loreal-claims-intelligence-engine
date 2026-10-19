import { ConflictException } from '@nestjs/common';
import { ClaimStatus } from '../generated/prisma/client.js';
import { assertTransition, canTransition } from './claim-status.js';

describe('claim status transitions', () => {
  it('follows the business flow in order', () => {
    expect(canTransition('PROPOSED', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'FORMULA_SUBMITTED')).toBe(true);
    expect(canTransition('FORMULA_SUBMITTED', 'EVIDENCE_ATTACHED')).toBe(true);
    expect(canTransition('EVIDENCE_ATTACHED', 'ASSESSED')).toBe(true);
  });

  it('does not allow skipping steps', () => {
    expect(canTransition('PROPOSED', 'FORMULA_SUBMITTED')).toBe(false);
    expect(canTransition('APPROVED', 'EVIDENCE_ATTACHED')).toBe(false);
    expect(canTransition('FORMULA_SUBMITTED', 'ASSESSED')).toBe(false);
  });

  it('treats a rejected claim as final', () => {
    for (const status of Object.values(ClaimStatus)) {
      expect(canTransition('REJECTED', status)).toBe(false);
    }
  });

  it('allows re-assessment and evidence updates after assessment', () => {
    expect(canTransition('ASSESSED', 'ASSESSED')).toBe(true);
    expect(canTransition('ASSESSED', 'EVIDENCE_ATTACHED')).toBe(true);
  });

  it('throws a ConflictException for an invalid move', () => {
    expect(() => assertTransition('PROPOSED', 'ASSESSED')).toThrow(
      ConflictException,
    );
  });
});
