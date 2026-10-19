import { ROLES, labelFor } from '../../constants.js'
import { useRole } from '../../context/roleContext.js'
import AssessPanel from './AssessPanel.jsx'
import EvidenceForm from './EvidenceForm.jsx'
import FormulaForm from './FormulaForm.jsx'
import ReviewForm from './ReviewForm.jsx'

const NEXT_STEP = {
  PROPOSED: {
    role: 'CLAIM_MANAGER',
    text: 'review the claim for applicability and feasibility',
  },
  APPROVED: { role: 'SCIENTIST', text: 'submit the product formula' },
  FORMULA_SUBMITTED: { role: 'EVALUATOR', text: 'attach the study results' },
  EVIDENCE_ATTACHED: { role: 'EVALUATOR', text: 'run the assessment' },
  ASSESSED: {
    role: 'EVALUATOR',
    text: 'update the evidence or re-run the assessment if needed',
  },
}

export default function ActionPanel({ claim, onChange }) {
  const { role } = useRole()
  const step = NEXT_STEP[claim.status]

  if (!step) {
    return (
      <div className="card muted">This claim was rejected and is closed.</div>
    )
  }

  if (step.role !== role) {
    return (
      <div className="card muted">
        Next step: the <strong>{labelFor(ROLES, step.role)}</strong> needs to{' '}
        {step.text}. Switch role in the top bar to continue.
      </div>
    )
  }

  return (
    <div className="card">
      {claim.status === 'PROPOSED' && (
        <ReviewForm claimId={claim.id} onDone={onChange} />
      )}
      {claim.status === 'APPROVED' && (
        <FormulaForm claimId={claim.id} onDone={onChange} />
      )}
      {claim.status === 'FORMULA_SUBMITTED' && (
        <EvidenceForm claim={claim} onDone={onChange} />
      )}
      {(claim.status === 'EVIDENCE_ATTACHED' ||
        claim.status === 'ASSESSED') && (
        <AssessPanel claim={claim} onDone={onChange} />
      )}
    </div>
  )
}
