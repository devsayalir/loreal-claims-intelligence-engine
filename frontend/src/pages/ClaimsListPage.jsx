import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../api/client.js'
import NewClaimForm from '../components/NewClaimForm.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { CLAIM_TYPES, labelFor } from '../constants.js'
import { useRole } from '../context/roleContext.js'

export default function ClaimsListPage() {
  const { role } = useRole()
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api
      .listClaims()
      .then(setClaims)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Claims</h1>
          <p className="subtitle">
            Proposed product claims and where they are in the substantiation
            process.
          </p>
        </div>
        {role === 'BUSINESS' && !showForm && (
          <button onClick={() => setShowForm(true)}>New claim</button>
        )}
      </div>

      {showForm && (
        <NewClaimForm
          onCancel={() => setShowForm(false)}
          onCreated={(claim) => navigate(`/claims/${claim.id}`)}
        />
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading claims...</p>
      ) : claims.length === 0 ? (
        <div className="card muted">
          No claims yet. Switch to the Business team role to propose one.
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Claim</th>
                <th>Type</th>
                <th>Status</th>
                <th>Verdict</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => {
                const latest = claim.assessments[0]
                return (
                  <tr key={claim.id}>
                    <td>
                      <Link to={`/claims/${claim.id}`}>
                        {claim.productName}
                      </Link>
                    </td>
                    <td className="claim-cell">{claim.claimText}</td>
                    <td>{labelFor(CLAIM_TYPES, claim.claimType)}</td>
                    <td>
                      <StatusBadge status={claim.status} />
                    </td>
                    <td>
                      {latest ? (
                        <span
                          className={
                            latest.justified ? 'verdict-yes' : 'verdict-no'
                          }
                        >
                          {latest.justified ? 'Justified' : 'Not justified'} (
                          {latest.confidenceScore}%)
                        </span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td className="nowrap">
                      {new Date(claim.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
