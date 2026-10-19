import { useState } from 'react'
import { api } from '../../api/client.js'
import { useRole } from '../../context/roleContext.js'
import { useAsyncAction } from '../../hooks/useAsyncAction.js'

export default function ReviewForm({ claimId, onDone }) {
  const { role } = useRole()
  const [note, setNote] = useState('')
  const { run, pending, error } = useAsyncAction(api.reviewClaim)

  async function submit(decision) {
    const updated = await run(
      claimId,
      { decision, note: note.trim() || undefined },
      role,
    )
    if (updated) onDone()
  }

  return (
    <div className="form">
      <h3>Review claim</h3>
      <p className="hint">
        Check whether the claim is applicable to the target markets and feasible
        to substantiate. A note is required to reject.
      </p>
      <label>
        Note
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Applicable to EU and UK. Instrumental proof required."
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button
          className="btn-danger"
          disabled={pending}
          onClick={() => submit('REJECT')}
        >
          Reject
        </button>
        <button disabled={pending} onClick={() => submit('APPROVE')}>
          Approve
        </button>
      </div>
    </div>
  )
}
