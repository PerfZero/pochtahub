import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api'
import logoSvg from '../assets/images/logo.svg'
import iconVerify from '../assets/images/icon-verify.svg'

function RegisterPage({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.password2) {
      alert('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      const response = await authAPI.register(formData)
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      setIsAuthenticated(true)
      navigate('/cabinet')
    } catch (error) {
      alert('Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="w-full flex justify-center items-center p-6">
        <div className="w-full max-w-[1128px] flex items-center gap-6">
          <Link to="/">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">Войти</Link>
            <Link to="/calculate" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Рассчитать</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[480px]">
          <div className="bg-white border border-[#C8C7CC] rounded-2xl p-8">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-2xl font-bold text-[#2D2D2D]">Регистрация</h1>
              <p className="text-sm text-[#858585]">Создайте аккаунт для управления отправками</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Логин"
                  required
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Логин *
                </label>
              </div>

              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Email"
                  required
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Email *
                </label>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Телефон"
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Телефон
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="Имя"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Имя
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="Фамилия"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Фамилия
                  </label>
                </div>
              </div>

              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Пароль"
                  required
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Пароль *
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                  placeholder="Подтверждение пароля"
                  required
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                  Подтверждение пароля *
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white mt-4 disabled:opacity-50"
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#C8C7CC] text-center">
              <p className="text-sm text-[#858585]">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-[#0077FE] font-semibold hover:underline">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full flex justify-center px-6 py-8">
        <div className="w-full max-w-[1128px] flex items-center justify-center gap-6 border-t border-[#C8C7CC] pt-8">
          <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  )
}

export default RegisterPage
