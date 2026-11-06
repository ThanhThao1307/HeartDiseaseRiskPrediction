import { Router } from 'express'
import axios from 'axios'
import mongoose from 'mongoose'
import Prediction from '../models/Prediction.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8000'
const FEATURE_KEYS = [
  '_AGE80', '_SEX', '_BMI5', 'BPHIGH6', 'TOLDHI3', 'DIABETE4',
  '_SMOKER3', 'EXERANY2', 'GENHLTH', 'PHYSHLTH', 'DIFFWALK', 'CVDSTRK3',
]
router.use(requireAuth)

router.post('/', async (req, res) => {
  const { features, model = 'all' } = req.body
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return res.status(400).json({ message: 'Thiếu dữ liệu 12 feature.' })
  }
  const keys = Object.keys(features).sort()
  if (keys.length !== FEATURE_KEYS.length || !FEATURE_KEYS.every((key) => keys.includes(key))) {
    return res.status(400).json({ message: 'Request phải chứa đúng 12 feature theo schema.' })
  }
  if (!['all', 'random_forest', 'xgboost', 'ann'].includes(model)) {
    return res.status(400).json({ message: 'Model không hợp lệ.' })
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