export const ROLES = [
  { value: 'BUSINESS', label: 'Business team' },
  { value: 'CLAIM_MANAGER', label: 'Claim manager' },
  { value: 'SCIENTIST', label: 'Scientist' },
  { value: 'EVALUATOR', label: 'Evaluator' },
]

export const CLAIM_TYPES = [
  { value: 'EFFICACY', label: 'Efficacy' },
  { value: 'SENSORY', label: 'Sensory' },
  { value: 'CONSUMER_PERCEPTION', label: 'Consumer perception' },
  { value: 'SAFETY', label: 'Safety' },
]

export const STATUS_LABELS = {
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FORMULA_SUBMITTED: 'Formula submitted',
  EVIDENCE_ATTACHED: 'Evidence attached',
  ASSESSED: 'Assessed',
}

export function labelFor(list, value) {
  return list.find((item) => item.value === value)?.label ?? value
}
