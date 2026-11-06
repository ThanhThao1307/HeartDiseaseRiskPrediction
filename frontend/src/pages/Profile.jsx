import { useState } from 'react'
import api, { getErrorMessage } from '../api.js'
import { useAuth } from '../auth/useAuth.js'

function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)
    try {
      const { data } = await api.patch('/users/me', form)
      setUser(data.user)
      setForm({ name: data.user.name, email: data.user.email })
      setMessage('Thông tin tài khoản đã được cập nhật.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-page profile-page">
      <div className="profile-heading"><p className="eyebrow">HỒ SƠ ĐỊNH DANH &amp; Y TẾ CÁ NHÂN</p><h1>Thông tin cá nhân &amp; Hồ sơ sức khỏe</h1><p className="page-description">Quản lý thông tin tài khoản và cập nhật các chỉ số nền tảng để theo dõi tiến trình.</p></div>
      <div className="security-banner"><span className="security-icon">▣</span><span><strong>Bảo mật tài khoản</strong><small>Thông tin cá nhân chỉ được sử dụng trong tài khoản của bạn.</small></span><span className="verified-badge"><i /> Đã xác thực</span></div>
      <div className="profile-layout">
        <aside className="profile-side">
          <section className="profile-identity"><div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div><h2>{user?.name}</h2><p className="profile-account-type">Tài khoản cá nhân</p><div className="profile-info"><div><span aria-hidden="true">✉</span><small>Email</small><strong>{user?.email}</strong></div><div><span aria-hidden="true">✓</span><small>Trạng thái</small><strong>Đang hoạt động</strong></div></div></section>
          <section className="device-card"><div className="device-card-head"><strong>Bảo vệ tài khoản</strong><span className="device-check">✓</span></div><p>Mật khẩu được mã hóa trước khi lưu. Các thao tác hồ sơ cần phiên đăng nhập hợp lệ.</p><div className="security-meter"><span /></div></section>
        </aside>
        <section className="profile-editor"><div className="profile-editor-heading"><span className="editor-icon" aria-hidden="true">✎</span><div><h2>Thông tin cơ bản</h2><p>Cập nhật tên hiển thị và địa chỉ email.</p></div></div>{message && <div className="notice notice-success">{message}</div>}{error && <div className="notice notice-error">{error}</div>}<form className="profile-form" onSubmit={handleSubmit}><label className="field"><span>Họ và tên</span><input type="text" maxLength="80" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="field"><span>Email</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><div className="profile-actions"><button className="button button-quiet" type="button" onClick={() => setForm({ name: user?.name ?? '', email: user?.email ?? '' })}>Hủy bỏ</button><button className="button button-dark" disabled={saving}>{saving ? 'Đang lưu...' : '▣　Lưu thay đổi'}</button></div></form></section>
      </div>
    </div>
  )
}

export default Profile
