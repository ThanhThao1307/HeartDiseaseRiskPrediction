const MODEL_LABELS = { random_forest: 'Random Forest', xgboost: 'XGBoost', ann: 'ANN' }

function getOutcomeLabel(prediction, riskLevel) {
  if (typeof riskLevel === 'string') return riskLevel
  if (prediction === 1) return 'Có nguy cơ bệnh tim'
  if (prediction === 0) return 'Chưa thấy nguy cơ bệnh tim'
  return 'Chưa có kết quả phân loại'
}

function PredictionResult({ results }) {
  const entries = Object.entries(results ?? {})

  return (
    <>
      <div className={`result-grid result-grid-${entries.length}`}>
        {entries.map(([name, result], index) => {
          const hasRiskScore = Number.isFinite(result.risk_score)
          const displayedScore = hasRiskScore ? result.risk_score : result.probability
          return (
            <article className={`result-panel result-panel-${index}`} key={name}>
              <div className="result-topline">
                <span>{MODEL_LABELS[name] ?? name}</span>
                <span className={`result-dot result-dot-${result.prediction}`} />
              </div>
              <p className={`result-status result-status-${result.prediction}`} role="status">
                {getOutcomeLabel(result.prediction, result.risk_level)}
              </p>
              <p className="result-number">
                {Number.isFinite(displayedScore)
                  ? `${(displayedScore * 100).toFixed(1)}%`
                  : '—'}
                <small>
                  {hasRiskScore
                    ? `Điểm mô hình · mức nguy cơ từ ${((result.threshold ?? 0.5) * 100).toFixed(0)}%`
                    : 'Xác suất ước tính (kết quả cũ)'}
                </small>
              </p>
            </article>
          )
        })}
      </div>
      {entries.some(([, result]) => Number.isFinite(result.risk_score)) && (
        <p className="risk-score-legend">
          50–59%: Có thể có nguy cơ · 60–69%: Khá cao · 70–79%: Cao · Từ 80%: Rất cao.
          Dưới 50%: Chưa thấy nguy cơ rõ rệt.
        </p>
      )}
    </>
  )
}

export default PredictionResult
