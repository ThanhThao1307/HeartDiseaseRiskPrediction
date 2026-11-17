# Heart Disease Project

## Giới thiệu

Ứng dụng web cho phép người dùng nhập các thông tin sức khỏe, chạy mô hình Random Forest, XGBoost hoặc ANN, xem kết quả và lưu lịch sử dự đoán theo tài khoản. Biểu mẫu yêu cầu nhập đầy đủ tám trường đầu vào trước khi chạy dự đoán. Model hiện dùng bộ biến được chọn từ BRFSS; nhãn `_MICHD` phản ánh tình trạng bệnh tim tự báo cáo trong khảo sát. Kết quả chỉ phục vụ tham khảo, không thay thế chẩn đoán y khoa.

## Công nghệ

- **Frontend:** React, Vite, Axios
- **Backend API và tài khoản:** Node.js, Express, MongoDB, Mongoose, JWT
- **Dịch vụ mô hình:** Python, FastAPI, scikit-learn, XGBoost, TensorFlow/Keras

## Cấu trúc thư mục

```text
HeartDisease_Project/
├── backend/
│   └── src/
│       ├── ai/
│       │   ├── assets/       # Model, preprocessor và metadata đầu vào
│       │   ├── main.py       # API suy luận
│       │   └── requirements.txt
│       ├── models/           # Schema MongoDB
│       ├── routes/           # API đăng nhập, người dùng, dự đoán
│       └── server.js         # Express server
├── frontend/
│   └── src/                  # Giao diện React
└── README.md
```

## Cài đặt và chạy

Cần có Node.js, Python, MongoDB và bộ model trong `backend/src/ai/assets/`.

1. **Khởi động MongoDB** trên máy hoặc dùng MongoDB Atlas.

2. **Chạy dịch vụ AI** trong cửa sổ terminal thứ nhất:

   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r src/ai/requirements.txt
   python -m uvicorn main:app --app-dir src/ai --host 127.0.0.1 --port 8000
   ```

3. **Cấu hình và chạy backend** trong cửa sổ terminal thứ hai. Tạo `backend/.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/heart_disease
   JWT_SECRET=replace_with_a_long_random_secret
   PORT=5000
   FRONTEND_ORIGIN=http://localhost:5173
   AI_SERVICE_URL=http://127.0.0.1:8000
   ```

   Sau đó chạy:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. **Chạy frontend** trong cửa sổ terminal thứ ba:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Mở địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173`.
