import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../api.js'
import PredictionForm from '../components/PredictionForm.jsx'

function Prediction() {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function submitPrediction(request) {
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/predictions', request)
      navigate(`/history/${data.prediction._id}`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="content-page"><div className="page-heading"><div><p className="eyebrow">PHÂN TÍCH MỚI</p><h1>Thông tin sức khỏe</h1><p className="page-description">Nhập 12 chỉ số theo bộ dữ liệu BRFSS để tạo dự đoán.</p></div><span className="heading-count">12 <small>feature</small></span></div>{error && <div className="notice notice-error">{error}</div>}<PredictionForm onSubmit={submitPrediction} submitting={submitting} /></div>
}

export default Prediction
