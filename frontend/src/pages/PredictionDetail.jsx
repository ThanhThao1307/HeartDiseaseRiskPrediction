import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api.js'
import PredictionResult from '../components/PredictionResult.jsx'
import { formatFeatureValue, getFeatureLabel } from '../featureLabels.js'

function PredictionDetail() {
  const { id } = useParams()
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/predictions/${id}`)
      .then(({ data }) => setPrediction(data.prediction))
      .catch((requestError) => setError(getErrorMessage(requestError)))
  }, [id])

  if (error) {
    return (
      <div className="content-page">
        <div className="notice notice-error">{error}</div>
        <Link className="text-link" to="/history">← Quay lại lịch sử</Link>
      </div>
    )
  }
  if (!prediction) return <div className="page-loading">Đang tải kết quả...</div>

  return (
    <div className="content-page result-analysis-page">
      <div className="page-heading detail-page-heading">
        <div>
          <p className="eyebrow">KẾT QUẢ DỰ ĐOÁN</p>
          <h1>Kết quả dự đoán</h1>
          <p className="page-description">
            {new Date(prediction.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <Link className="button button-dark" to="/predict">Dự đoán mới</Link>
      </div>

      <section className="detail-section result-model-section">
        <PredictionResult results={prediction.results} />
      </section>

      <details className="detail-section submitted-inputs">
        <summary>Thông tin đã nhập</summary>
        <dl className="feature-list">
          {Object.entries(prediction.features ?? {}).map(([name, value]) => (
            <div className="feature-row" key={name}>
              <dt>{getFeatureLabel(name)}</dt>
              <dd>{value === null || value === undefined ? 'Không cung cấp' : formatFeatureValue(name, value)}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}

export default PredictionDetail
