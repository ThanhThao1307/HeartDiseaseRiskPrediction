import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import predictionRoutes from './routes/predictions.js'

const app = express()
const port = Number(process.env.PORT ?? 5000)

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '32kb' }))
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/predictions', predictionRoutes)
app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ message: 'Đã xảy ra lỗi máy chủ.' })
})

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET must be configured')
  }
  await mongoose.connect(process.env.MONGODB_URI)
  app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`))
}

start().catch((error) => {
  console.error('Backend startup failed:', error.message)
  process.exit(1)
})