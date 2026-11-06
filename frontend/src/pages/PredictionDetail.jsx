import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api.js'
import PredictionResult from '../components/PredictionResult.jsx'

const MODEL_LABELS = { random_forest: 'Random Forest', xgboost: 'XGBoost', ann: 'ANN' }

function getRiskBand(probability) {
  if (probability < 0.2) return { label: 'Thấp', className: 'risk-low' }
  if (probability <= 0.5) return { label: 'Trung bình', className: 'risk-medium' }
  return { label: 'Cao', className: 'risk-high' }
}

function getNotableFactors(features) {
  const factors = []
  const bmi = Number(features._BMI5) / 100

  if (features.BPHIGH6 === 1 || features.BPHIGH6 === 4) {
    factors.push({ icon: '＋', title: 'Đã khai báo huyết áp cao', detail: 'Câu trả lời cho biết có tiền sử huyết áp cao.', tone: 'coral' })
  }
  if (features.TOLDHI3 === 1) {
    factors.push({ icon: '⌁', title: 'Đã khai báo cholesterol cao', detail: 'Câu trả lời cho biết cholesterol từng được ghi nhận cao.', tone: 'coral' })
  }
  if ([1, 2, 4].includes(features.DIABETE4)) {
    factors.push({ icon: '⌁', title: 'Có thông tin về tiểu đường', detail: 'Bao gồm tiểu đường, tiểu đường thai kỳ hoặc tiền tiểu đường theo câu trả lời.', tone: 'blue' })
  }
  if (features._SMOKER3 === 1 || features._SMOKER3 === 2) {
    factors.push({ icon: '♨', title: 'Đang hút thuốc', detail: features._SMOKER3 === 1 ? 'Câu trả lời: hút thuốc hàng ngày.' : 'Câu trả lời: hút thuốc một số ngày.', tone: 'blue' })
  }
  if (features.CVDSTRK3 === 1) {
    factors.push({ icon: '＋', title: 'Đã khai báo tiền sử đột quỵ', detail: 'Dữ liệu đầu vào ghi nhận câu trả lời có tiền sử đột quỵ.', tone: 'coral' })
  }
  if (features.DIFFWALK === 1) {
    factors.push({ icon: '↗', title: 'Đã khai báo khó khăn khi đi bộ', detail: 'Thông tin được lấy từ câu trả lời khảo sát.', tone: 'blue' })
  }
  if (Number.isFinite(bmi) && bmi >= 23) {
    factors.push({ icon: '▣', title: 'BMI trên mốc tham khảo 23', detail: 'BMI đầu vào', value: `${bmi.toFixed(1)} kg/m²`, tone: 'blue' })
  }

  return factors.slice(0, 4)
}

function PredictionDetail() {
  const { id } = useParams()
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/predictions/${id}`)
      .then(({ data }) => setPrediction(data.prediction))
      .catch((requestError) => setError(getErrorMessage(requestError)))
  }, [id])

  if (error) return <div className="content-page"><div className="notice notice-error">{error}</div><Link className="text-link" to="/history">← Quay lại lịch sử</Link></div>
  if (!prediction) return <div className="page-loading">Đang tải kết quả...</div>

  const modelResults = Object.values(prediction.results ?? {})
  const meanProbability = modelResults.length ? modelResults.reduce((sum, result) => sum + result.probability, 0) / modelResults.length : 0
  const riskBand = getRiskBand(meanProbability)
  const notableFactors = getNotableFactors(prediction.features ?? {})
  const modelCount = modelResults.length

  return (
    <div className="content-page result-analysis-page">
      <article className="result-analysis-card">
        <header className="result-analysis-header"><span className="result-kicker">Kết quả đánh giá</span><span className="result-timestamp"><i /> Vừa hoàn thành</span></header>
        <section className="risk-overview">
          <p className="risk-caption">Xác suất mô hình ghi nhận bệnh tim mạch</p>
          <div className="risk-score-row"><strong>{(meanProbability * 100).toFixed(1)}%</strong><span className={`risk-indicator ${riskBand.className}`} aria-label={`Mức xác suất ${riskBand.label}`} /></div>
          <div className="risk-scale-heading"><span>Phân tầng xác suất tham khảo</span><span className={`risk-chip ${riskBand.className}`}>Mức {riskBand.label}</span></div>
          <div className="risk-scale" role="img" aria-label={`Xác suất ${(meanProbability * 100).toFixed(1)}%, mốc phân tầng 20% và 50%`}><span className="risk-segment risk-segment-low" /><span className="risk-segment risk-segment-medium" /><span className="risk-segment risk-segment-high" /><i className="risk-marker" style={{ left: `${Math.min(meanProbability * 100, 100)}%` }} /></div>
          <div className="risk-scale-labels"><span>Thấp (&lt;20%)</span><span>Trung bình (20–50%)</span><span>Cao (&gt;50%)</span></div>
        </section>
        <p className="result-summary">{modelCount === 1 ? `Kết quả được tạo bởi ${MODEL_LABELS[prediction.model] ?? prediction.model}.` : `Điểm tổng hợp là trung bình xác suất từ ${modelCount} mô hình được chạy. Đây là kết quả của mô hình, không phải chẩn đoán.`}</p>
        <aside className="result-caution"><span aria-hidden="true">i</span><p><strong>Lưu ý quan trọng:</strong> Kết quả chỉ mang tính sàng lọc tham khảo ban đầu, không thay thế chẩn đoán y khoa. Hãy trao đổi với bác sĩ hoặc chuyên gia y tế để được đánh giá phù hợp.</p></aside>
        <section className="risk-factors"><h2>Thông tin đầu vào cần lưu ý</h2><p className="factor-context">Các mục dưới đây được rút ra từ câu trả lời đã gửi, không phải mức độ ảnh hưởng do mô hình giải thích.</p>{notableFactors.length ? <div className="factor-list">{notableFactors.map((factor) => <article className="factor-row" key={factor.title}><span className={`factor-icon factor-icon-${factor.tone}`}>{factor.icon}</span><span className="factor-copy"><strong>{factor.title}</strong><small>{factor.detail}</small></span>{factor.value ? <strong className="factor-value">{factor.value}</strong> : <span className={`factor-tag factor-tag-${factor.tone}`}>{factor.tone === 'coral' ? 'Đã khai báo' : 'Cần lưu ý'}</span>}</article>)}</div> : <div className="factor-empty">Không có mục nào trong các câu trả lời đã gửi khớp với những dấu hiệu hiển thị tại đây. Điều này không loại trừ nguy cơ sức khỏe.</div>}</section>
        <section className="model-breakdown"><div className="model-breakdown-heading"><div><h2>Kết quả theo từng mô hình</h2><p>{prediction.model === 'all' ? 'So sánh các xác suất đã được tính.' : 'Kết quả của mô hình đã chọn.'}</p></div><span>{modelCount} {modelCount === 1 ? 'mô hình' : 'mô hình'}</span></div><PredictionResult results={prediction.results} /></section>
        <footer className="result-actions"><Link className="button button-white" to="/predict"><span aria-hidden="true">↻</span> Làm lại bài đánh giá</Link><Link className="button button-dark" to="/#how-it-works">Xem quy trình <span aria-hidden="true">→</span></Link></footer>
      </article>
      <p className="result-contact">Cần hỗ trợ tư vấn? Hãy trao đổi kết quả với chuyên gia y tế của bạn.</p>
      <Link className="result-contact-link" to="/profile">Thông tin tài khoản <span aria-hidden="true">↗</span></Link>
    </div>
  )
}

export default PredictionDetail
