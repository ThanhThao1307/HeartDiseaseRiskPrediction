import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId).select('name email createdAt')
  if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
  return res.json({ user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } })
})

router.patch('/me', async (req, res) => {
  const updates = {}
  if (typeof req.body.name === 'string') {
    const name = req.body.name.trim()
    if (!name || name.length > 80) return res.status(400).json({ message: 'Tên phải có từ 1 đến 80 ký tự.' })
    updates.name = name
  }
  if (typeof req.body.email === 'string') {
    const email = req.body.email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Email không hợp lệ.' })
    updates.email = email
  }
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Không có thông tin cần cập nhật.' })

  try {
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('name email createdAt')
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
    return res.json({ user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email này đã được sử dụng.' })
    throw error
  }
})

export default router