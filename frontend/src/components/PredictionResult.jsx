const MODEL_LABELS = { random_forest: 'Random Forest', xgboost: 'XGBoost', ann: 'ANN' }

function PredictionResult({ results }) {
  return <div className="result-grid">{Object.entries(results ?? {}).map(([name, result], index) => <article className={`result-panel result-panel-${index}`} key={name}><div className="result-topline"><span>{MODEL_LABELS[name] ?? name}</span><span className={`result-dot result-dot-${result.prediction}`} /></div><p className="result-number">{(result.probability * 100).toFixed(1)}<small>%</small></p><p className="result-label">{result.label}</p>{Number.isFinite(result.threshold) && <p className="result-threshold">Ngưỡng phân loại: {(result.threshold * 100).toFixed(1)}%</p>}<div className="probability-track" aria-label={`Xác suất ${MODEL_LABELS[name]}: ${(result.probability * 100).toFixed(1)}%`}><span style={{ width: `${Math.max(0, Math.min(result.probability * 100, 100))}%` }} /></div></article>)}</div>
}

export default PredictionResult