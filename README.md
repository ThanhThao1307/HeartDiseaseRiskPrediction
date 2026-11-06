# Heart Disease Risk Prediction

Ứng dụng web hỗ trợ **tham khảo nguy cơ bệnh tim mạch** từ 12 thông tin sức khỏe. Người dùng có thể chạy một mô hình hoặc so sánh đồng thời ba mô hình học máy, xem lại kết quả và theo dõi lịch sử đánh giá của mình.

> **Lưu ý:** Đây là công cụ sàng lọc/tham khảo, không phải công cụ chẩn đoán và không thay thế tư vấn của chuyên gia y tế.

## Công nghệ sử dụng

- **Frontend:** React 19, React Router, Vite, Tailwind CSS.
- **Backend:** Node.js, Express 5, MongoDB và Mongoose.
- **Dịch vụ AI:** Python, FastAPI, scikit-learn, XGBoost, Keras và TensorFlow.
- **Mô hình:** Random Forest, XGBoost và mạng nơ-ron nhân tạo (ANN).

## Chức năng chính

- Đăng ký, đăng nhập và quản lý thông tin tài khoản.
- Nhập 12 chỉ số sức khỏe và chọn một mô hình hoặc cả ba mô hình để dự đoán.
- Xem xác suất, ngưỡng phân loại và kết quả của từng mô hình.
- Xem chi tiết và lịch sử đánh giá.
- Lọc, tìm kiếm, theo dõi biểu đồ lịch sử và xuất dữ liệu lịch sử ra CSV.

## Yêu cầu môi trường

- Node.js **20.19+** hoặc **22.12+**, kèm npm.
- Python **3.10–3.12**.
- MongoDB đang chạy cục bộ hoặc một MongoDB Atlas URI.

## Cài đặt

Mở PowerShell tại thư mục gốc của project. Các lệnh cài đặt và khởi chạy bên dưới giả định thư mục hiện tại là thư mục này.

### 1. Cấu hình backend và cài dịch vụ AI

Cài các package của backend:

```powershell
cd backend
npm install
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r src\ai\requirements.txt
```

Nếu chưa cài Python 3.12, thay `-3.12` bằng phiên bản Python từ 3.10 đến 3.12 đã cài trên máy.

### 3. Cài frontend

Mở một PowerShell khác tại thư mục gốc của project:

```powershell
cd frontend
npm install
```

## Chạy project

Đảm bảo MongoDB đã hoạt động và cấu hình hợp lệ. Khởi chạy ba dịch vụ trong **ba cửa sổ PowerShell riêng**, theo thứ tự:

Mở từng cửa sổ PowerShell tại thư mục gốc của project.

**Cửa sổ 1 — Dịch vụ AI:**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --app-dir src\ai --host 127.0.0.1 --port 8000 --reload
```

**Cửa sổ 2 — Backend:**

```powershell
cd backend
npm run dev
```

**Cửa sổ 3 — Frontend:**

```powershell
cd frontend
npm run dev
```