const STEPS = [
  { status: 'PROPOSED', label: 'Proposed' },
  { status: 'APPROVED', label: 'Reviewed' },
  { status: 'FORMULA_SUBMITTED', label: 'Formula' },
  { status: 'EVIDENCE_ATTACHED', label: 'Evidence' },
  { status: 'ASSESSED', label: 'Assessed' },
]

export default function WorkflowSteps({ status }) {
  const rejected = status === 'REJECTED'
  const current = rejected
    ? 1
    : STEPS.findIndex((step) => step.status === status)

  return (
    <ol className="steps">
      {STEPS.map((step, i) => {
        let state = 'todo'
        if (i < current || (i === current && status === 'ASSESSED')) {
          state = 'done'
        } else if (i === current) {
          state = rejected ? 'rejected' : 'current'
        }
        return (
          <li key={step.status} className={`step step-${state}`}>
            {rejected && i === 1 ? 'Rejected' : step.label}
          </li>
        )
      })}
    </ol>
  )
}
