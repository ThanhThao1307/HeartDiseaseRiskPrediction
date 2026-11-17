import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../api.js'
import PredictionForm from '../components/PredictionForm.jsx'

function Prediction() {
  const [error, setError] = useState('')
  const [schema, setSchema] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    api.get('/predictions/schema')
      .then(({ data }) => {
        if (active) setSchema(data)
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })
    return () => { active = false }
  }, [])

  async function loadSchema() {
    setError('')
    try {
      const { data } = await api.get('/predictions/schema')
      setSchema(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

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

  if (!schema && !error) return <div className="page-loading" role="status">Đang tải biểu mẫu...</div>

  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DỰ ĐOÁN MỚI</p>
          <h1>Thông tin sức khỏe</h1>
        </div>
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {schema && <PredictionForm schema={schema} onSubmit={submitPrediction} submitting={submitting} />}
      {!schema && <button className="button button-white" type="button" onClick={loadSchema}>Tải lại biểu mẫu</button>}
    </div>
  )
}

export default Prediction
