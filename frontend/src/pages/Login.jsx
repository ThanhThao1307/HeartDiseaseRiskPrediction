import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api.js'
import { useAuth } from '../auth/useAuth.js'

function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (user) navigate(location.state?.from ?? '/', { replace: true })
  }, [user, location.state, navigate])

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Đăng nhập</h1>
          <p className="form-lead">Đăng nhập để dự đoán và lưu kết quả.</p>
          {error && <div className="notice notice-error">{error}</div>}
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
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <button className="button button-dark button-wide" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Login
