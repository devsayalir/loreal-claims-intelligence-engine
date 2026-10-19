export default function EvidenceFields({ value, onChange }) {
  const update = (field) => (e) =>
    onChange({ ...value, [field]: e.target.value })

  return (
    <>
      <label>
        Study design
        <input
          required
          value={value.studyDesign}
          onChange={update('studyDesign')}
          placeholder="Randomised, double-blind, vehicle-controlled"
        />
      </label>
      <div className="form-row">
        <label>
          Sample size
          <input
            type="number"
            min={1}
            value={value.sampleSize}
            onChange={update('sampleSize')}
            placeholder="64"
          />
        </label>
        <label>
          Duration
          <input
            value={value.studyDuration}
            onChange={update('studyDuration')}
            placeholder="8 weeks"
          />
        </label>
      </div>
      <label>
        Results
        <textarea
          required
          rows={5}
          value={value.evidenceText}
          onChange={update('evidenceText')}
          placeholder="Endpoints, measurement method, results at each timepoint, statistics..."
        />
      </label>
    </>
  )
}
