import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client.js'
import AssessmentResult from '../components/AssessmentResult.jsx'
import EvidenceFields from '../components/EvidenceFields.jsx'
import { CLAIM_TYPES } from '../constants.js'
import { useRole } from '../context/roleContext.js'
import { EMPTY_EVIDENCE, toEvidencePayload } from '../evidence.js'
import { useAsyncAction } from '../hooks/useAsyncAction.js'

const EXAMPLE = {
  claim: {
    productName: 'Revitalift Laser Night Cream',
    claimText: 'Reduces wrinkles by 20% in 4 weeks',
    claimType: 'EFFICACY',
  },
  evidence: {
    studyDesign: 'Randomised, vehicle-controlled, single-centre study',
    sampleSize: '48',
    studyDuration: '8 weeks',
    evidenceText:
      "Women aged 40-60 with moderate crow's feet wrinkles. Wrinkle depth measured by " +
      'fringe projection at D0, D28 and D56. Mean reduction vs baseline: 11% at 4 weeks ' +
      'and 21% at 8 weeks (p<0.05 vs vehicle).',
  },
}

export default function QuickAssessPage() {
  const { role } = useRole()
  const [claim, setClaim] = useState({
    productName: '',
    claimText: '',
    claimType: 'EFFICACY',
  })
  const [evidence, setEvidence] = useState(EMPTY_EVIDENCE)
  const [result, setResult] = useState(null)
  const { run, pending, error } = useAsyncAction(api.assess)

  const isEvaluator = role === 'EVALUATOR'
  const updateClaim = (field) => (e) =>
    setClaim({ ...claim, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setResult(null)
    const assessment = await run(
      { claim, evidence: toEvidencePayload(evidence) },
      role,
    )
    if (assessment) setResult(assessment)
  }

  function loadExample() {
    setClaim(EXAMPLE.claim)
    setEvidence(EXAMPLE.evidence)
    setResult(null)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Quick assess</h1>
          <p className="subtitle">
            Check a claim against study results directly, without going through
            the full workflow. The result is saved with the claim.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadExample}>
          Load example
        </button>
      </div>

      {!isEvaluator && (
        <div className="notice notice-inline">
          Only evaluators can run assessments. Switch role to Evaluator in the
          top bar.
        </div>
      )}

      <div className="detail-grid">
        <form className="card form" onSubmit={handleSubmit}>
          <h2>Claim</h2>
          <div className="form-row">
            <label>
              Product name
              <input
                required
                value={claim.productName}
                onChange={updateClaim('productName')}
              />
            </label>
            <label>
              Claim type
              <select
                value={claim.claimType}
                onChange={updateClaim('claimType')}
              >
                {CLAIM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Claim
            <textarea
              required
              rows={2}
              maxLength={500}
              value={claim.claimText}
              onChange={updateClaim('claimText')}
              placeholder="Reduces wrinkles by 20% in 4 weeks"
            />
          </label>

          <h2>Evidence</h2>
          <EvidenceFields value={evidence} onChange={setEvidence} />

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="submit" disabled={pending || !isEvaluator}>
              {pending ? 'Assessing...' : 'Assess claim'}
            </button>
          </div>
        </form>

        <div className="stack">
          {result ? (
            <>
              <h2>Result</h2>
              <AssessmentResult assessment={result} />
              <Link to={`/claims/${result.claimId}`}>Open saved claim</Link>
            </>
          ) : (
            <div className="card muted">
              {pending
                ? 'Waiting for the assessment...'
                : 'The assessment will appear here.'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
