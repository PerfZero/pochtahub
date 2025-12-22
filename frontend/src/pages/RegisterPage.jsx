import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api'
import logoSvg from '../assets/images/logo.svg'
import iconVerify from '../assets/images/icon-verify.svg'

function RegisterPage({ setIsAuthenticated }) {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!phone) {
      setError('Введите номер телефона')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authAPI.sendCode(phone)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки кода')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!code) {
      setError('Введите код')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authAPI.verifyCode(phone, code)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.password2) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.register({ phone, ...formData })
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      setIsAuthenticated(true)
      navigate('/cabinet')
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
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
              <p className="text-sm text-[#858585]">
                {step === 1 && 'Введите номер телефона для получения кода'}
                {step === 2 && 'Введите код из Telegram'}
                {step === 3 && 'Заполните данные для завершения регистрации'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="Телефон"
                    required
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Телефон *
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white mt-4 disabled:opacity-50"
                >
                  {loading ? 'Отправка...' : 'Получить код в Telegram'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <div className="p-4 bg-[#F4EEE2] rounded-xl">
                  <p className="text-sm text-[#2D2D2D]">
                    Код отправлен на <strong>{phone}</strong> в Telegram
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-2xl text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent text-center tracking-widest"
                    placeholder="Код"
                    maxLength={4}
                    required
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Код из Telegram *
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white mt-4 disabled:opacity-50"
                >
                  {loading ? 'Проверка...' : 'Подтвердить'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-[#858585] hover:text-[#0077FE]"
                >
                  Изменить номер
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700">
                    ✓ Телефон {phone} подтверждён
                  </p>
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="peer w-full px-4 pt-6 pb-2 pr-12 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="Пароль"
                    required
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Пароль *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#858585] bg-transparent border-none p-0 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword2 ? "text" : "password"}
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className="peer w-full px-4 pt-6 pb-2 pr-12 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="Подтверждение пароля"
                    required
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Подтверждение пароля *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#858585] bg-transparent border-none p-0 cursor-pointer"
                  >
                    {showPassword2 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white mt-4 disabled:opacity-50"
                >
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </form>
            )}

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
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          </Link>
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  )
}

export default RegisterPage
