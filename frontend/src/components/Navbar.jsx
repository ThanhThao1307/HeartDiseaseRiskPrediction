import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="HeartCare - Trang chủ">
        <span className="brand-mark" aria-hidden="true">♥</span>
        <span>Heart<strong>Care</strong><small>DỰ ĐOÁN NGUY CƠ</small></span>
      </Link>
      <nav className="main-nav" aria-label="Điều hướng chính">
        <NavLink to="/">Trang chủ</NavLink>
        {user && <NavLink to="/predict">Dự đoán</NavLink>}
        {user && <NavLink to="/history">Lịch sử</NavLink>}
      </nav>
      <div className="account-nav">
        {user ? (
          <>
            <Link className="account-profile" to="/profile" aria-label={`Hồ sơ ${user.name}`}>
              <span className="account-avatar">{user.name?.[0]?.toUpperCase()}</span>
              <span className="account-name">{user.name}</span>
            </Link>
            <button className="button button-quiet button-small logout-button" onClick={handleLogout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link className="button button-quiet button-small" to="/login">Đăng nhập</Link>
            <Link className="button button-dark button-small" to="/register">Đăng ký</Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar