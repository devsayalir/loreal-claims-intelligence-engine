import { useState } from 'react'
import { api } from '../api/client.js'
import { CLAIM_TYPES } from '../constants.js'
import { useRole } from '../context/roleContext.js'
import { useAsyncAction } from '../hooks/useAsyncAction.js'

const EMPTY = {
  productName: '',
  claimText: '',
  claimType: 'EFFICACY',
  proposedBy: '',
}

export default function NewClaimForm({ onCreated, onCancel }) {
  const { role } = useRole()
  const [form, setForm] = useState(EMPTY)
  const { run, pending, error } = useAsyncAction(api.createClaim)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    const body = { ...form, proposedBy: form.proposedBy || undefined }
    const claim = await run(body, role)
    if (claim) onCreated(claim)
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Propose a new claim</h2>

      <div className="form-row">
        <label>
          Product name
          <input
            required
            value={form.productName}
            onChange={update('productName')}
            placeholder="Revitalift Laser Night Cream"
          />
        </label>
        <label>
          Claim type
          <select value={form.claimType} onChange={update('claimType')}>
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
          value={form.claimText}
          onChange={update('claimText')}
          placeholder="Reduces wrinkles by 20% in 4 weeks"
        />
      </label>

      <label>
        Proposed by <span className="optional">(optional)</span>
        <input
          value={form.proposedBy}
          onChange={update('proposedBy')}
          placeholder="Skincare Marketing - Paris"
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Submit claim'}
        </button>
      </div>
    </form>
  )
}
