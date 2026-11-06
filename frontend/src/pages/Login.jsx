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
    if (user) navigate('/', { replace: true })
  }, [user, navigate])
  return <section className="auth-screen"><div className="auth-card"><Link className="auth-brand" to="/"><span className="brand-mark">♥</span><span>Heart<strong>Care</strong><small>HỆ THỐNG SỨC KHỎE TIM MẠCH</small></span></Link><p className="auth-platform">NỀN TẢNG THEO DÕI SỨC KHỎE TIM MẠCH</p><nav className="auth-tabs" aria-label="Tài khoản"><Link className="active" to="/login">Đăng nhập</Link><Link to="/register">Đăng ký</Link></nav><form className="auth-form" onSubmit={handleSubmit}><p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p><h1>Đăng nhập</h1><p className="form-lead">Nhập thông tin tài khoản để tiếp tục.</p>{error && <div className="notice notice-error">{error}</div>}<label className="field"><span>Địa chỉ Email</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label className="field"><span>Mật khẩu</span><input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label><button className="button button-dark button-wide" disabled={submitting}>{submitting ? 'Đang đăng nhập...' : '↪ Đăng nhập vào HeartCare'}</button><p className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p><div className="auth-security"><span aria-hidden="true">✓</span> Dữ liệu tài khoản được bảo vệ bằng JWT.</div><Link className="auth-home-link" to="/">← Quay lại trang chủ</Link></form></div></section>
}

export default Login
