import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

function Home() {
  const { user } = useAuth()

  return (
    <div className="home-page prediction-home">
      <section className="home-intro">
        <div className="home-copy">
          <p className="eyebrow">DỰ ĐOÁN BỆNH TIM</p>
          <h1>Đánh giá nguy cơ<br /><em>bệnh tim.</em></h1>
          <p className="intro-description">
            Nhập thông tin sức khỏe để xem kết quả từ ba mô hình học máy.
          </p>
          <div className="home-actions">
            <Link
              className="button button-dark"
              to={user ? '/predict' : '/login'}
              state={user ? undefined : { from: '/predict' }}
            >
              Bắt đầu dự đoán <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-link" to="/about">Tìm hiểu ứng dụng</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
