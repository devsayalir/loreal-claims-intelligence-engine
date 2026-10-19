function confidenceLevel(score) {
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export default function AssessmentResult({ assessment, compact = false }) {
  const { justified, confidenceScore, reasoning, provider, model, createdAt } =
    assessment
  const level = confidenceLevel(confidenceScore)

  return (
    <section className={`result ${justified ? 'result-yes' : 'result-no'}`}>
      <div className="result-header">
        <div>
          <div className="result-label">Justified</div>
          <div className="result-verdict">{justified ? 'Yes' : 'No'}</div>
        </div>

        <div className="result-confidence">
          <div className="result-label">Confidence score</div>
          <div className="confidence">
            <div className="confidence-track">
              <div
                className={`confidence-fill confidence-${level}`}
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            <span className="confidence-value">{confidenceScore}%</span>
          </div>
        </div>
      </div>

      <div className="result-label">Reasoning</div>
      <p className="result-reasoning">{reasoning}</p>

      {!compact && (
        <p className="result-meta">
          {provider} / {model} &middot; {new Date(createdAt).toLocaleString()}
        </p>
      )}
    </section>
  )
}
