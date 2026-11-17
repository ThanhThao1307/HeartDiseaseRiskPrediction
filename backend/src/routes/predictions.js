import { Router } from 'express'
import axios from 'axios'
import mongoose from 'mongoose'
import Prediction from '../models/Prediction.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8000'
router.use(requireAuth)

router.get('/schema', async (_req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/schema`, { timeout: 15000 })
    return res.json(response.data)
  } catch {
    return res.status(503).json({ message: 'Không thể tải schema đầu vào từ dịch vụ AI.' })
  }
})

router.post('/', async (req, res) => {
  const { features, model = 'all' } = req.body
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return res.status(400).json({ message: 'Thiếu dữ liệu feature hợp lệ.' })
  }
  if (!['all', 'random_forest', 'xgboost', 'ann'].includes(model)) {
    return res.status(400).json({ message: 'Model không hợp lệ.' })
  }
  if (Object.values(features).some((value) => value === null || value === undefined || value === '')) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ các thông tin sức khỏe.' })
  }

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, { features, model }, { timeout: 120000 })
    const prediction = await Prediction.create({ user: req.userId, features, model, results: response.data.results })
    return res.status(201).json({ prediction })
  } catch (error) {
    if (error.response) {
      const detail = error.response.data.detail
      const message = typeof detail === 'string' ? detail : 'Dữ liệu đầu vào không hợp lệ.'
      return res.status(error.response.status).json({ message })
    }
    if (error.code === 'ECONNABORTED') return res.status(504).json({ message: 'AI xử lý quá thời gian chờ.' })
    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Không thể lưu kết quả vào MongoDB.' })
    }
    if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Không thể kết nối dịch vụ AI.' })
    throw error
  }
})

router.get('/', async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20
  const predictions = await Prediction.find({ user: req.userId }).sort({ createdAt: -1 }).limit(limit).lean()
  return res.json({ predictions })
})

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Không tìm thấy dự đoán.' })
  const prediction = await Prediction.findOne({ _id: req.params.id, user: req.userId }).lean()
  if (!prediction) return res.status(404).json({ message: 'Không tìm thấy dự đoán.' })
  return res.json({ prediction })
})

export default router