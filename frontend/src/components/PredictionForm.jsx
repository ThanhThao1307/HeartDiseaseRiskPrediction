import { useState } from 'react'

const surveyFields = [
  { key: '_SEX', label: 'Giới tính', options: [['1', 'Nam'], ['2', 'Nữ']] },
  { key: 'BPHIGH6', label: 'Huyết áp cao', options: [['1', 'Có'], ['2', 'Chỉ khi mang thai'], ['3', 'Không'], ['4', 'Tiền tăng huyết áp'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
  { key: 'TOLDHI3', label: 'Cholesterol cao', options: [['1', 'Có'], ['2', 'Không'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
  { key: 'DIABETE4', label: 'Tiểu đường', options: [['1', 'Có'], ['2', 'Chỉ khi mang thai'], ['3', 'Không'], ['4', 'Tiền tiểu đường'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
  { key: '_SMOKER3', label: 'Hút thuốc', options: [['1', 'Hàng ngày'], ['2', 'Một số ngày'], ['3', 'Đã từng hút'], ['4', 'Chưa từng hút'], ['9', 'Từ chối']] },
  { key: 'EXERANY2', label: 'Hoạt động thể chất trong 30 ngày qua', options: [['1', 'Có'], ['2', 'Không'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
  { key: 'GENHLTH', label: 'Sức khỏe tổng quát', options: [['1', 'Rất tốt'], ['2', 'Tốt'], ['3', 'Khá'], ['4', 'Kém'], ['5', 'Rất kém'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
  { key: 'DIFFWALK', label: 'Khó khăn khi đi bộ', options: [['1', 'Có'], ['2', 'Không'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
  { key: 'CVDSTRK3', label: 'Tiền sử đột quỵ', options: [['1', 'Có'], ['2', 'Không'], ['7', 'Không rõ'], ['9', 'Từ chối']] },
]

function PredictionForm({ onSubmit, submitting }) {
  const [values, setValues] = useState({})
  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
  }
  function handleSubmit(event) {
    event.preventDefault()
    const featureValues = Object.fromEntries(Object.entries(values).filter(([key]) => key !== 'model'))
    const features = Object.fromEntries(Object.entries(featureValues).map(([key, value]) => [key, value === '' || value === undefined ? null : Number(value)]))
    onSubmit({ features, model: values.model || 'all' })
  }

  return (
    <form className="prediction-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <div className="section-heading"><span className="section-index">01</span><div><h2>Chỉ số cơ thể</h2><p>Nhập giá trị hiện tại của người được đánh giá.</p></div></div>
        <div className="form-grid form-grid-three">
          <label className="field"><span>Tuổi</span><input type="number" min="18" max="80" step="1" value={values._AGE80 ?? ''} onChange={(event) => update('_AGE80', event.target.value)} required /></label>
          <label className="field"><span>BMI</span><input type="number" min="1" max="100" step="0.1" value={values._BMI5 ?? ''} onChange={(event) => update('_BMI5', event.target.value)} required /><small>Nhập BMI thực tế, không nhân 100.</small></label>
          <label className="field"><span>Số ngày sức khỏe thể chất không tốt</span><select value={values.PHYSHLTH ?? ''} onChange={(event) => update('PHYSHLTH', event.target.value)} required><option value="" disabled>Chọn giá trị</option>{Array.from({ length: 31 }, (_, day) => <option key={day} value={day}>{day} ngày</option>)}<option value="88">Không có ngày nào</option><option value="77">Không rõ</option><option value="99">Từ chối</option></select></label>
        </div>
      </section>
      <section className="form-section">
        <div className="section-heading"><span className="section-index">02</span><div><h2>Tiền sử và lối sống</h2><p>Các lựa chọn giữ nguyên mã khảo sát của bộ dữ liệu.</p></div></div>
        <div className="form-grid form-grid-three">{surveyFields.map((field) => <label className="field" key={field.key}><span>{field.label}</span><select value={values[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)} required><option value="" disabled>Chọn câu trả lời</option>{field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}</div>
      </section>
      <section className="form-section form-section-last">
        <div className="section-heading"><span className="section-index">03</span><div><h2>Chọn mô hình</h2><p>Có thể chạy một mô hình hoặc so sánh cả ba.</p></div></div>
        <label className="field model-field"><span>Mô hình dự đoán</span><select value={values.model ?? 'all'} onChange={(event) => update('model', event.target.value)}><option value="all">Cả ba mô hình</option><option value="random_forest">Random Forest</option><option value="xgboost">XGBoost</option><option value="ann">ANN</option></select></label>
      </section>
      <div className="form-submit"><p>Kết quả chỉ mang tính tham khảo, không thay thế tư vấn y khoa.</p><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Đang phân tích...' : 'Chạy dự đoán'}</button></div>
    </form>
  )
}

export default PredictionForm