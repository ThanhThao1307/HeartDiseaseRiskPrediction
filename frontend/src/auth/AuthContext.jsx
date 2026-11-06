import { useEffect, useState } from 'react'
import api from '../api.js'
import { AuthContext } from './auth-context.js'

const TOKEN_KEY = 'heart-disease-token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.get('/users/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function authenticate(path, credentials) {
    const { data } = await api.post(path, credentials)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login: (data) => authenticate('/auth/login', data), register: (data) => authenticate('/auth/register', data), logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}