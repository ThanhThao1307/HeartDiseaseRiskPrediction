import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

function createToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (!name || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Vui lòng nhập tên, email hợp lệ và mật khẩu từ 8 đến 128 ký tự.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    return res.status(201).json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email này đã được đăng ký.' })
    throw error
  }
})

router.post('/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
  }
  return res.json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } })
})

export default router