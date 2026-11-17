import { useState } from 'react'
import { getFeatureLabel, getFeatureOptionLabel } from '../featureLabels.js'

function PredictionForm({ schema, onSubmit, submitting }) {
  const [values, setValues] = useState({ model: 'all' })
  const [formError, setFormError] = useState('')

  function update(key, value) {
    setFormError('')
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const missingRequired = schema.features.some((field) => (
      values[field.name] === '' || values[field.name] === undefined || values[field.name] === null
    ))
    if (missingRequired) {
      setFormError('Vui lòng điền đầy đủ các mục có dấu * trước khi chạy dự đoán.')
      return
    }

    const features = Object.fromEntries(schema.features.map((field) => {
      const value = values[field.name]
      return [field.name, value === '' || value === undefined ? null : Number(value)]
    }))
    setFormError('')
    onSubmit({ features, model: values.model || 'all' })
  }

  return (
    <form className="prediction-form" onSubmit={handleSubmit}>
      {formError && <div className="notice notice-error" role="alert">{formError}</div>}
      <section className="form-section">
        <p className="form-required-note">
          <span className="required-mark" aria-hidden="true">*</span>
          {' '}Vui lòng điền đầy đủ các mục có dấu sao để chạy dự đoán.
        </p>
        <div className="form-grid form-grid-two">
          {schema.features.map((field) => (
            <label className="field" key={field.name}>
              <span>
                {getFeatureLabel(field.name, field.label)}
                <span className="required-mark" aria-label="bắt buộc"> *</span>
              </span>
              {field.kind === 'categorical' ? (
                <select
                  required
                  value={values[field.name] ?? ''}
                  onChange={(event) => update(field.name, event.target.value)}
                >
                  <option value="">Chọn một đáp án</option>
                  {field.options.map((option) => (
                    <option key={`${field.name}-${option.value}`} value={option.value}>
                      {getFeatureOptionLabel(field.name, option.value, option.label)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  required
                  min={field.min ?? undefined}
                  max={field.max ?? undefined}
                  step={field.name === '_BMI5' ? 'any' : field.step ?? 'any'}
                  value={values[field.name] ?? ''}
                  onChange={(event) => update(field.name, event.target.value)}
                  placeholder={field.name === '_AGE80' ? 'Nhập tuổi' : field.name === '_BMI5' ? 'Ví dụ: 30' : 'Nhập giá trị'}
                />
              )}
            </label>
          ))}
        </div>
      </section>
      <div className="form-controls">
        <label className="field model-field">
          <span>Mô hình dự đoán</span>
          <select value={values.model} onChange={(event) => update('model', event.target.value)}>
            <option value="all">So sánh cả ba mô hình</option>
            <option value="random_forest">Random Forest</option>
            <option value="xgboost">XGBoost</option>
            <option value="ann">Mạng nơ-ron ANN</option>
          </select>
        </label>
        <button className="button button-dark" type="submit" disabled={submitting}>
          {submitting ? 'Đang dự đoán...' : 'Chạy dự đoán'}
        </button>
      </div>
    </form>
  )
}

export default PredictionForm
