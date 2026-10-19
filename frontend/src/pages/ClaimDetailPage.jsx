import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../api/client.js'
import ActionPanel from '../components/actions/ActionPanel.jsx'
import AssessmentResult from '../components/AssessmentResult.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import WorkflowSteps from '../components/WorkflowSteps.jsx'
import { CLAIM_TYPES, labelFor } from '../constants.js'

function Detail({ label, children }) {
  if (children === null || children === undefined || children === '') {
    return null
  }
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export default function ClaimDetailPage() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api
      .getClaim(id)
      .then((data) => {
        setClaim(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(load, [load])

  if (error) {
    return (
      <>
        <Link to="/" className="back">
          Back to claims
        </Link>
        <p className="error">{error}</p>
      </>
    )
  }
  if (!claim) return <p className="muted">Loading...</p>

  const [latest, ...previous] = claim.assessments

  return (
    <>
      <Link to="/" className="back">
        Back to claims
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">
            {claim.productName} &middot;{' '}
            {labelFor(CLAIM_TYPES, claim.claimType)}
          </p>
          <h1>&ldquo;{claim.claimText}&rdquo;</h1>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <WorkflowSteps status={claim.status} />

      <div className="detail-grid">
        <div className="stack">
          <section className="card">
            <h2>Claim file</h2>
            <dl className="details">
              <Detail label="Proposed by">{claim.proposedBy}</Detail>
              <Detail label="Review note">{claim.reviewNote}</Detail>
              <Detail label="Formula">
                {claim.formulaReference && (
                  <>
                    <strong>{claim.formulaReference}</strong>
                    <br />
                    {claim.formulaDetails}
                  </>
                )}
              </Detail>
              <Detail label="Study design">{claim.studyDesign}</Detail>
              <Detail label="Sample size">{claim.sampleSize}</Detail>
              <Detail label="Duration">{claim.studyDuration}</Detail>
              <Detail label="Results">{claim.evidenceText}</Detail>
            </dl>
          </section>

          <ActionPanel claim={claim} onChange={load} />
        </div>

        <div className="stack">
          {latest ? (
            <>
              <h2>Latest assessment</h2>
              <AssessmentResult assessment={latest} />
            </>
          ) : (
            <div className="card muted">No assessment yet.</div>
          )}

          {previous.length > 0 && (
            <>
              <h2>Previous assessments</h2>
              {previous.map((a) => (
                <details key={a.id} className="card history">
                  <summary>
                    {new Date(a.createdAt).toLocaleString()} &middot;{' '}
                    {a.justified ? 'Justified' : 'Not justified'} (
                    {a.confidenceScore}%)
                  </summary>
                  <AssessmentResult assessment={a} compact />
                </details>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}
