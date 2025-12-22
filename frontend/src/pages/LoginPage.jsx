import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authAPI } from '../api'
import logoSvg from '../assets/images/logo.svg'
import iconVerify from '../assets/images/icon-verify.svg'

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
    <div className="min-h-screen flex flex-col bg-white">
      <header className="w-full flex justify-center items-center p-6">
        <div className="w-full max-w-[1128px] flex items-center gap-6">
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/calculate" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Рассчитать</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          <div className="bg-white border border-[#C8C7CC] rounded-2xl p-8">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-2xl font-bold text-[#2D2D2D]">Вход в аккаунт</h1>
              <p className="text-sm text-[#858585]">Войдите, чтобы отслеживать заказы и управлять отправками</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Логин"
                  required
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Логин
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Пароль"
                  required
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Пароль
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white mt-4 disabled:opacity-50"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#C8C7CC] text-center">
              <p className="text-sm text-[#858585]">
                Нет аккаунта?{' '}
                <Link to="/register" className="text-[#0077FE] font-semibold hover:underline">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full flex justify-center px-6 py-8">
        <div className="w-full max-w-[1128px] flex items-center justify-center gap-6 border-t border-[#C8C7CC] pt-8">
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          </Link>
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
