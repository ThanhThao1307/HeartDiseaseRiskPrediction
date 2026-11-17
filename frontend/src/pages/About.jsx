import { Link } from 'react-router-dom'

const MODELS = [
  {
    name: 'Random Forest',
    description: 'Kết hợp kết quả từ nhiều cây quyết định, thường ổn định hơn một cây đơn lẻ và phù hợp với dữ liệu dạng bảng.',
  },
  {
    name: 'XGBoost',
    description: 'Xây dựng các cây quyết định nối tiếp, mỗi cây tập trung cải thiện lỗi của các cây trước. Phù hợp với dữ liệu dạng bảng.',
  },
  {
    name: 'Mạng nơ-ron ANN',
    description: 'Học các mối quan hệ phi tuyến qua nhiều lớp nơ-ron. Có thể nhận ra mẫu phức tạp nhưng khó giải thích hơn.',
  },
]

function About() {
  return (
    <div className="content-page about-page">
      <header className="page-heading about-heading">
        <div>
          <p className="eyebrow">GIỚI THIỆU DỰ ÁN</p>
          <h1>Dự đoán nguy cơ bệnh tim bằng học máy</h1>
          <p className="page-description">
            Nhập thông tin sức khỏe để xem kết quả dự đoán và so sánh ba mô hình.
          </p>
        </div>
        <Link className="button button-dark" to="/predict">Thử dự đoán</Link>
      </header>

      <section className="about-overview">
        <h2>Ứng dụng này làm gì?</h2>
        <p>
          Người dùng nhập thông tin sức khỏe, chọn mô hình dự đoán và xem kết quả
          để so sánh cách các mô hình đưa ra đánh giá.
        </p>
      </section>

      <section className="about-models">
        <h2>Ba mô hình được sử dụng</h2>
        <div className="about-model-grid">
          {MODELS.map((model, index) => (
            <article className="about-model-card" key={model.name}>
              <span className="about-model-number">0{index + 1}</span>
              <h3>{model.name}</h3>
              <p>{model.description}</p>
            </article>
          ))}
        </div>
      </section>

    </div>
  )
}

export default About
