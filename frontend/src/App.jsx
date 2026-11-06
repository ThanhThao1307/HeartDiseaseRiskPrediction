import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import History from './pages/History.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Prediction from './pages/Prediction.jsx'
import PredictionDetail from './pages/PredictionDetail.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Navbar />
        <main className="page-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/predict" element={<Prediction />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<PredictionDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="site-footer">Thông tin dự đoán chỉ mang tính tham khảo, không thay thế chẩn đoán y khoa.</footer>
      </div>
    </AuthProvider>
  )
}

export default App
