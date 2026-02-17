import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'
import './AdminLogin.css'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAdminStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(password)
      navigate('/admin')
    } catch {
      setError('Invalid password. The owls are watching.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-owl">🦉</div>
        <h1>Cartowl</h1>
        <p className="login-subtitle">Cartographer's Guild — Staff Only</p>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Guild password..." required autoFocus />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Consulting the owls...' : 'Enter Guild'}
          </button>
        </form>
        <a href="/" className="login-back">← Return to the Map</a>
      </div>
    </div>
  )
}
