import { useState } from 'react'
import { api } from '../../api/client.js'
import { useRole } from '../../context/roleContext.js'
import { useAsyncAction } from '../../hooks/useAsyncAction.js'
import { toEvidencePayload } from '../../evidence.js'
import EvidenceFields from '../EvidenceFields.jsx'

export default function EvidenceForm({ claim, onDone, onCancel }) {
  const { role } = useRole()
  const [evidence, setEvidence] = useState({
    studyDesign: claim.studyDesign ?? '',
    sampleSize: claim.sampleSize ?? '',
    studyDuration: claim.studyDuration ?? '',
    evidenceText: claim.evidenceText ?? '',
  })
  const { run, pending, error } = useAsyncAction(api.attachEvidence)

  async function handleSubmit(e) {
    e.preventDefault()
    const updated = await run(claim.id, toEvidencePayload(evidence), role)
    if (updated) onDone()
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>
        {claim.evidenceText ? 'Update study results' : 'Attach study results'}
      </h3>
      <EvidenceFields value={evidence} onChange={setEvidence} />

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save evidence'}
        </button>
      </div>
    </form>
  )
}
