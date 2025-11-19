import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authAPI } from '../api'
import './LoginPage.css'

function LoginPage({ setIsAuthenticated }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authAPI.login({ username, password })
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      setIsAuthenticated(true)
      
      const returnTo = location.state?.returnTo
      const orderData = location.state?.orderData
      
      if (returnTo === '/order' && orderData) {
        navigate('/order', { state: orderData })
      } else if (returnTo) {
        navigate(returnTo)
      } else {
        navigate('/cabinet')
      }
    } catch (error) {
      alert('Ошибка входа. Проверьте данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <h1>Вход</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Логин</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  )
}

export default LoginPage


