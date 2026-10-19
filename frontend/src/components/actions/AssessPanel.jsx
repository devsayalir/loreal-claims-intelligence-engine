import { useState } from 'react'
import { api } from '../../api/client.js'
import { useRole } from '../../context/roleContext.js'
import { useAsyncAction } from '../../hooks/useAsyncAction.js'
import EvidenceForm from './EvidenceForm.jsx'

export default function AssessPanel({ claim, onDone }) {
  const { role } = useRole()
  const [editing, setEditing] = useState(false)
  const { run, pending, error } = useAsyncAction(api.assess)

  async function handleAssess() {
    const result = await run({ claimId: claim.id }, role)
    if (result) onDone()
  }

  if (editing) {
    return (
      <EvidenceForm
        claim={claim}
        onCancel={() => setEditing(false)}
        onDone={() => {
          setEditing(false)
          onDone()
        }}
      />
    )
  }

  const rerun = claim.status === 'ASSESSED'

  return (
    <div className="form">
      <h3>{rerun ? 'Re-run assessment' : 'Run assessment'}</h3>
      <p className="hint">
        The study results are sent to the assessment model, which checks whether
        they support the claim as worded. Each run is stored.
      </p>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button
          className="btn-secondary"
          disabled={pending}
          onClick={() => setEditing(true)}
        >
          Edit evidence
        </button>
        <button disabled={pending} onClick={handleAssess}>
          {pending ? 'Assessing...' : rerun ? 'Re-assess' : 'Assess claim'}
        </button>
      </div>
    </div>
  )
}
