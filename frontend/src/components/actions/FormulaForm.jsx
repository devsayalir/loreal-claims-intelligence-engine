import { useState } from 'react'
import { api } from '../../api/client.js'
import { useRole } from '../../context/roleContext.js'
import { useAsyncAction } from '../../hooks/useAsyncAction.js'

export default function FormulaForm({ claimId, onDone }) {
  const { role } = useRole()
  const [form, setForm] = useState({ formulaReference: '', formulaDetails: '' })
  const { run, pending, error } = useAsyncAction(api.submitFormula)

  async function handleSubmit(e) {
    e.preventDefault()
    const updated = await run(claimId, form, role)
    if (updated) onDone()
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>Submit formula</h3>
      <label>
        Formula reference
        <input
          required
          value={form.formulaReference}
          onChange={(e) =>
            setForm({ ...form, formulaReference: e.target.value })
          }
          placeholder="F-2026-0412"
        />
      </label>
      <label>
        Key ingredients and concentrations
        <textarea
          required
          rows={3}
          value={form.formulaDetails}
          onChange={(e) => setForm({ ...form, formulaDetails: e.target.value })}
          placeholder="Pro-retinol 0.3%, niacinamide 4%, hyaluronic acid 0.5%"
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={pending}>
          {pending ? 'Submitting...' : 'Submit formula'}
        </button>
      </div>
    </form>
  )
}
