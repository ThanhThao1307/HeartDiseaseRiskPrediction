import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api.js'
import { useAuth } from '../auth/useAuth.js'

function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate(location.state?.from ?? '/predict', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (user) navigate(location.state?.from ?? '/predict', { replace: true })
  }, [user, location.state, navigate])
  return (
    <section className="auth-screen">
      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Tạo tài khoản</h1>
          <p className="form-lead">Tài khoản giúp lưu và xem lại kết quả dự đoán.</p>
          {error && <div className="notice notice-error">{error}</div>}
          <label className="field">
            <span>Họ và tên</span>
            <input
              type="text"
              autoComplete="name"
              maxLength="80"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Địa chỉ email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength="8"
              maxLength="128"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <small>Tối thiểu 8 ký tự.</small>
          </label>
          <button className="button button-dark button-wide" disabled={submitting}>
            {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
          <p className="auth-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Register
