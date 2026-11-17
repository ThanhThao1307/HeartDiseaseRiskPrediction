import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import About from './pages/About.jsx'
import History from './pages/History.jsx'
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
            <Route path="/" element={<About />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/predict" element={<Prediction />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<PredictionDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<About />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
