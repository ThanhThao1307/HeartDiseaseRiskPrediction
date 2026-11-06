import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api.js'
import { useAuth } from '../auth/useAuth.js'

function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])
  return <section className="auth-screen"><div className="auth-card"><Link className="auth-brand" to="/"><span className="brand-mark">♥</span><span>Heart<strong>Care</strong><small>HỆ THỐNG SỨC KHỎE TIM MẠCH</small></span></Link><p className="auth-platform">NỀN TẢNG THEO DÕI SỨC KHỎE TIM MẠCH</p><nav className="auth-tabs" aria-label="Tài khoản"><Link to="/login">Đăng nhập</Link><Link className="active" to="/register">Đăng ký</Link></nav><form className="auth-form" onSubmit={handleSubmit}><p className="eyebrow">BẮT ĐẦU SỬ DỤNG</p><h1>Tạo tài khoản</h1><p className="form-lead">Lưu và xem lại các lần đánh giá của bạn.</p>{error && <div className="notice notice-error">{error}</div>}<label className="field"><span>Họ và tên</span><input type="text" autoComplete="name" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="field"><span>Địa chỉ Email</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label className="field"><span>Mật khẩu</span><input type="password" autoComplete="new-password" minLength="8" maxLength="128" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><small>Tối thiểu 8 ký tự.</small></label><button className="button button-dark button-wide" disabled={submitting}>{submitting ? 'Đang tạo tài khoản...' : '＋ Tạo tài khoản HeartCare'}</button><p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p><div className="auth-security"><span aria-hidden="true">✓</span> Mật khẩu được mã hóa trước khi lưu.</div><Link className="auth-home-link" to="/">← Quay lại trang chủ</Link></form></div></section>
}

export default Register
