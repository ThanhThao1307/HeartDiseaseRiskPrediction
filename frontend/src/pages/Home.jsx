import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api.js'
import { useAuth } from '../auth/useAuth.js'

function Home() {
  const { user } = useAuth()
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    api.get('/predictions?limit=3')
      .then(({ data }) => setRecent(data.predictions))
      .catch((requestError) => setError(getErrorMessage(requestError)))
  }, [user])

  const latest = recent[0]
  const latestScore = latest ? Math.max(...Object.values(latest.results).map((result) => result.probability)) : null

  return (
    <div className="home-page">
      <section className="home-intro">
        <div className="home-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> CHỦ ĐỘNG BẢO VỆ TRÁI TIM</p>
          <h1>Đánh giá nguy cơ<br /><em>bệnh tim mạch.</em></h1>
          <p className="intro-description">Phân tích 12 chỉ số sức khỏe bằng ba mô hình học máy, lưu kết quả và theo dõi các lần đánh giá của riêng bạn.</p>
          <div className="home-actions"><Link className="button button-dark" to={user ? '/predict' : '/register'}>Dự đoán ngay <span aria-hidden="true">♡</span></Link><a className="button button-white" href="#how-it-works"><span aria-hidden="true">▤</span> Tìm hiểu quy trình</a></div>
          <div className="hero-assurances"><div><span className="assurance-icon">✓</span><span><strong>Riêng tư</strong><small>Lịch sử gắn với tài khoản</small></span></div><div><span className="assurance-icon">◷</span><span><strong>12 chỉ số</strong><small>Đầu vào theo schema</small></span></div><div><span className="assurance-icon">▧</span><span><strong>3 mô hình</strong><small>So sánh dự đoán</small></span></div></div>
        </div>
        <aside className="analysis-card" aria-label="Thông tin hệ thống phân tích">
          <div className="analysis-card-head"><span className="analysis-icon">♡</span><div><strong>Phân tích AI</strong><small>Ba mô hình học máy</small></div><span className="live-badge"><i /> Sẵn sàng</span></div>
          <div className="analysis-summary"><div className="analysis-score-ring"><span>{latestScore === null ? '12' : `${(latestScore * 100).toFixed(1)}%`}</span><small>{latestScore === null ? 'CHỈ SỐ ĐẦU VÀO' : 'XÁC SUẤT CAO NHẤT'}</small></div><div className="analysis-summary-note"><span className="status-dot" />{latestScore === null ? 'Chưa có lần đánh giá' : 'Lần đánh giá gần nhất'}<small>{latest ? new Date(latest.createdAt).toLocaleDateString('vi-VN') : 'Nhập chỉ số để bắt đầu'}</small></div></div>
          <div className="model-status-list"><div><span className="model-status-icon">⌁</span><span>Random Forest</span><strong>{latest?.results?.random_forest ? `${(latest.results.random_forest.probability * 100).toFixed(1)}%` : '300 cây'}</strong></div><div><span className="model-status-icon">⌁</span><span>XGBoost</span><strong>{latest?.results?.xgboost ? `${(latest.results.xgboost.probability * 100).toFixed(1)}%` : 'Đã sẵn sàng'}</strong></div><div><span className="model-status-icon">⌁</span><span>ANN</span><strong>{latest?.results?.ann ? `${(latest.results.ann.probability * 100).toFixed(1)}%` : 'Đã sẵn sàng'}</strong></div></div>
          <div className="analysis-card-foot"><span>Pipeline tiền xử lý đã huấn luyện</span><span>30 features</span></div>
        </aside>
      </section>
      <section className="steps-strip" id="how-it-works" aria-label="Quy trình đánh giá"><div><span>1</span><strong>Nhập chỉ số</strong><small>12 thông tin sức khỏe</small></div><div><span>2</span><strong>AI phân tích</strong><small>Ba mô hình độc lập</small></div><div><span>3</span><strong>Xem kết quả</strong><small>Xác suất từng mô hình</small></div><div><span>4</span><strong>Theo dõi</strong><small>Lịch sử riêng tư</small></div></section>
      <section className="solutions-section"><div className="solutions-heading"><p className="eyebrow">CÔNG CỤ THEO DÕI SỨC KHỎE</p><h2>Mọi thông tin, trong một nơi</h2><p>Kết quả rõ ràng để bạn trao đổi cùng chuyên gia y tế.</p></div><div className="solution-grid"><article className="solution-card"><span className="solution-icon">⌁</span><h3>Phân tích ba mô hình</h3><p>Xem riêng xác suất từ Random Forest, XGBoost và mạng nơ-ron ANN trên cùng bộ chỉ số.</p><Link to={user ? '/predict' : '/register'}>Bắt đầu phân tích <span aria-hidden="true">→</span></Link></article><article className="solution-card"><span className="solution-icon">▥</span><h3>Lịch sử của bạn</h3><p>Tra cứu các lần đánh giá đã lưu, xem lại dữ liệu đầu vào và kết quả từng mô hình.</p><Link to={user ? '/history' : '/register'}>{user ? 'Mở lịch sử' : 'Tạo tài khoản'} <span aria-hidden="true">→</span></Link></article><article className="solution-card"><span className="solution-icon">♡</span><h3>Thông tin minh bạch</h3><p>Xem đủ 12 chỉ số đã gửi và cách mỗi mô hình đưa ra xác suất dự đoán.</p><Link to={user ? '/profile' : '/login'}>{user ? 'Thông tin cá nhân' : 'Đăng nhập'} <span aria-hidden="true">→</span></Link></article></div></section>
      {user && <section className="recent-section"><div className="section-title-row"><div><p className="eyebrow">KHÔNG GIAN CỦA BẠN</p><h2>Dự đoán gần đây</h2></div><Link className="text-link" to="/history">Toàn bộ lịch sử <span aria-hidden="true">→</span></Link></div>{error && <div className="notice notice-error">{error}</div>}{!error && recent.length === 0 && <div className="empty-state"><span className="empty-mark">01</span><div><h3>Chưa có dự đoán nào</h3><p>Nhập bộ chỉ số đầu tiên để bắt đầu theo dõi.</p></div><Link className="button button-outline" to="/predict">Tạo dự đoán</Link></div>}{recent.length > 0 && <div className="recent-list">{recent.map((item) => <Link className="recent-row" to={`/history/${item._id}`} key={item._id}><span className="recent-date">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span><span className="recent-model">{item.model === 'all' ? 'So sánh ba mô hình' : item.model}</span><span className="recent-score">{Math.max(...Object.values(item.results).map((result) => result.probability * 100)).toFixed(1)}%<small> xác suất cao nhất</small></span><span aria-hidden="true">→</span></Link>)}</div>}</section>}
      <section className="home-cta"><div><p className="eyebrow">BẮT ĐẦU NGAY HÔM NAY</p><h2>Sẵn sàng xem lại các chỉ số sức khỏe?</h2><p>Dữ liệu của bạn được lưu trong tài khoản để xem lại bất cứ lúc nào.</p></div><Link className="button button-white" to={user ? '/predict' : '/register'}>{user ? 'Bắt đầu đánh giá' : 'Tạo tài khoản'} <span aria-hidden="true">→</span></Link></section>
    </div>
  )
}

export default Home
