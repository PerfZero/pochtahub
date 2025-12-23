import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import CityInput from '../components/CityInput'
import PhoneInput from '../components/PhoneInput'
import CodeInput from '../components/CodeInput'
import { authAPI } from '../api'

import logoSvg from '../assets/images/logo.svg'
import iconTelegram from '../assets/images/icon-telegram.svg'
import iconArrowRight from '../assets/images/icon-arrow-right.svg'
import iconVerify from '../assets/images/icon-verify.svg'
import heroConcept from '../assets/images/hero-concept.svg'
import logosStrip from '../assets/images/logos-strip.svg'
import iconCheckCircle from '../assets/images/icon-check-circle.svg'
import aboutMain from '../assets/images/about-main.png'
import aboutBox1 from '../assets/images/about-box-1.png'
import aboutBox2 from '../assets/images/about-box-2.png'
import aboutBox3 from '../assets/images/about-box-3.png'
import qrCode from '../assets/images/qr-code.svg'

function CalculatePage() {
  const [fromCity, setFromCity] = useState('')
  const [toCity, setToCity] = useState('')
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [telegramSent, setTelegramSent] = useState(false)
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('access_token')
  
  const handleSendCode = async (method = 'telegram') => {
    if (!phone) {
      setCodeError('Введите номер телефона')
      return
    }
    setCodeLoading(true)
    setCodeError('')
    setTelegramSent(false)
    try {
      const response = await authAPI.sendCode(phone, method)
      if (response.data?.success || response.data?.telegram_sent) {
        if (response.data?.telegram_sent) {
          setTelegramSent(true)
        }
        setCodeSent(true)
      } else {
        setCodeError(response.data?.error || 'Ошибка отправки кода')
      }
    } catch (err) {
      const errorData = err.response?.data
      setCodeError(errorData?.error || err.message || 'Ошибка отправки кода')
    } finally {
      setCodeLoading(false)
    }
  }
  
  const handleSendSmsCode = async () => {
    await handleSendCode('sms')
  }
  
  const handleVerifyCode = async (code = null) => {
    const codeToVerify = code || smsCode
    if (!codeToVerify || codeToVerify.length !== 4) {
      setCodeError('Введите код')
      return
    }
    setVerifyLoading(true)
    setCodeError('')
    try {
      const response = await authAPI.verifyCode(phone, codeToVerify)
      
      if (response.data && response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access)
        localStorage.setItem('refresh_token', response.data.tokens.refresh)
        setShowLoginPopup(false)
        setPhone('')
        setSmsCode('')
        setCodeSent(false)
        window.location.reload()
      } else if (response.data && !response.data.user_exists) {
        setCodeError('Пользователь не найден. Пожалуйста, зарегистрируйтесь.')
      }
    } catch (err) {
      setCodeError(err.response?.data?.error || err.message || 'Неверный код')
    } finally {
      setVerifyLoading(false)
    }
  }
  
  const handleResendCode = () => {
    setSmsCode('')
    setCodeError('')
    setTelegramSent(false)
    setCodeSent(false)
  }

  const handleCalculate = async (e) => {
    e.preventDefault()
    if (!fromCity || !toCity) {
      alert('Заполните поля откуда и куда')
      return
    }
    
    const wizardData = {
      fromCity,
      toCity,
      weight: '0.1',
      length: '23',
      width: '16',
      height: '2',
      senderAddress: fromCity,
      deliveryAddress: toCity
    }
    
    navigate('/offers', {
      state: {
        wizardData
      }
    })
  }

  const handleCalculateClick = () => {
    if (!fromCity || !toCity) {
      alert('Заполните поля откуда и куда')
      return
    }
    navigate('/wizard', {
      state: {
        fromCity,
        toCity
      }
    })
  }

  return (
    <>
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-[420px] w-full relative">
            <button
              onClick={() => {
                setShowLoginPopup(false)
                setPhone('')
                setSmsCode('')
                setCodeSent(false)
                setCodeError('')
                setTelegramSent(false)
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
            
            <div className="p-8">
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                Вход в профиль
              </h2>
              <p className="text-base text-center text-[#2D2D2D] mb-6">
                {!codeSent 
                  ? 'Введите номер телефона, код будет отправлен в Telegram'
                  : telegramSent 
                    ? 'Введите код из Telegram'
                    : 'Введите код из SMS'}
              </p>
              
              {!codeSent ? (
                <>
                  <div className="mb-6">
                    <PhoneInput
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      label="Телефон"
                    />
                  </div>
                  {codeError && (
                    <div className="mb-4">
                      <p className="text-sm text-red-500 text-center mb-2">{codeError}</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleSendCode('telegram')}
                    disabled={codeLoading || !phone}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {codeLoading ? 'Отправка...' : 'Получить код в Telegram'}
                  </button>
                  <button
                    onClick={handleSendSmsCode}
                    disabled={codeLoading || !phone}
                    className="w-full bg-[#F5F5F5] text-[#2D2D2D] px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                  >
                    {codeLoading ? 'Отправка...' : 'Отправить SMS'}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <CodeInput
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      onComplete={(code) => {
                        setSmsCode(code)
                        if (code && code.length === 4) {
                          handleVerifyCode(code)
                        }
                      }}
                    />
                  </div>
                  {codeError && (
                    <div className="mb-4">
                      <p className="text-sm text-red-500 text-center mb-2">{codeError}</p>
                    </div>
                  )}
                  {telegramSent && (
                    <p className="text-sm text-green-600 mb-4 text-center">
                      Код отправлен в Telegram
                    </p>
                  )}
                  {!telegramSent && codeSent && (
                    <p className="text-sm text-[#858585] mb-4 text-center">
                      Код отправлен в SMS
                    </p>
                  )}
                  <div className="flex flex-col gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false)
                        setSmsCode('')
                        setCodeError('')
                        setTelegramAvailable(false)
                        setTelegramSent(false)
                      }}
                      className="text-sm text-[#0077FE] hover:underline text-center"
                    >
                      Изменить номер
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={codeLoading}
                      className="text-sm text-[#858585] hover:text-[#2D2D2D] disabled:opacity-50 text-center"
                    >
                      Отправить код заново
                    </button>
                  </div>
                  <button
                    onClick={() => handleVerifyCode()}
                    disabled={verifyLoading || !smsCode || smsCode.length !== 4}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyLoading ? 'Проверка...' : 'Продолжить'}
                  </button>
                </>
              )}
              
              <p className="text-xs text-center text-[#858585] mt-6">
                Авторизуясь, вы соглашаетесь{' '}
                <a href="#" className="text-[#0077FE] hover:underline">с Пользовательским соглашением</a>
                {' '}и{' '}
                <a href="#" className="text-[#0077FE] hover:underline">Политикой конфиденциальности</a>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="min-h-screen flex flex-col items-center bg-white">
      {/* TopLine */}
      <div className="w-full bg-[#ADD3FF] flex justify-center cursor-pointer">
        <div className="w-full max-w-[1128px] px-6 py-2 flex items-center justify-center gap-3">
          <img src={iconTelegram} alt="" className="w-6 h-6" />
          <span className="text-sm font-semibold text-[#2D2D2D]">Еще быстрее и удобнее отправить посылку в нашем Telegram-боте</span>
          <img src={iconArrowRight} alt="" className="w-6 h-6" />
        </div>
      </div>

      {/* Header */}
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
            {isAuthenticated ? (
              <Link to="/cabinet" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">Личный кабинет</Link>
            ) : (
              <button 
                onClick={() => setShowLoginPopup(true)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
              >
                Войти
              </button>
            )}
            <button className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Рассчитать</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full flex justify-center px-6">
        <div className="w-full max-w-[1128px] border border-[#C8C7CC] rounded-2xl ">
          <div className="bg-[#EEE5D3] py-2 flex items-center justify-center border rounded-t-2xl">
            <img src={logosStrip} alt=""  />
          </div>
          <div className="bg-[#F9F6F0] px-[72px] py-0 flex items-end justify-center gap-8">
            <div className="flex-1 flex flex-col justify-center gap-6 py-12">
              <h1 className="text-[48px] font-bold leading-[1.25] text-[#2D2D2D]">Сфотографируй посылку —<br />мы всё сделаем</h1>
              <p className="text-base leading-[1.5] text-[#2D2D2D]">Получатель тоже может начать отправку<br />Если вы ждёте посылку — оформите доставку сами.<br />Мы свяжемся с отправителем и всё сделаем.</p>
            </div>
            <div className="shrink-0">
              <img src={heroConcept} alt="" className="h-[428px]" />
            </div>
          </div>
          <form className="bg-white border-t border-[#C8C7CC] shadow-[0_4px_8px_0_rgba(0,0,0,0.08)] flex" onSubmit={handleCalculate}>
            <div className="flex-1 flex items-center ">
              <CityInput
                placeholder="Откуда"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center border-l border-[#C8C7CC]">
              <CityInput
                placeholder="Куда"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-center px-1.5 py-1">
              <button type="submit" className="px-8 py-4 rounded-[10px] text-base font-semibold bg-[#0077FE] text-white whitespace-nowrap">Рассчитать и оформить</button>
            </div>
          </form>
          <div className="bg-[#F9F6F0] px-6 py-4 flex items-center justify-center border-t border-[#C8C7CC] rounded-b-2xl">
            <p className="text-sm text-[#2D2D2D]">Начать оформление может как отправитель, так и получатель</p>
          </div>
        </div>
      </section>

      {/* How */}
      <section className="w-full flex justify-center px-6 py-16">
        <div className="w-full max-w-[1128px] flex flex-col gap-8">
          <h2 className="text-[40px] font-bold text-[#2D2D2D]">Как это работает?</h2>
          <div className="flex flex-col gap-12">
            <div className="flex gap-6 items-start justify-center">
              <div className="pt-6">
                <div className="w-[340px] h-[380px] bg-[rgba(0,119,254,0.16)] rounded-2xl p-6 flex flex-col gap-6 -rotate-3">
                  <div className="w-10 h-10 rounded-full bg-[#0077FE] flex items-center justify-center text-lg font-bold text-white">1</div>
                  <h3 className="text-xl font-bold text-[#2D2D2D]">Сфотографируй посылку или выбери фото из галереи</h3>
                  <p className="text-sm text-[#2D2D2D]">Загрузи фотографию с компьютера или с телефона</p>
                </div>
              </div>
              <div className="">
                <div className="w-[312px] h-[348px] bg-[rgba(246,189,96,0.32)] rounded-2xl p-6 flex flex-col gap-6">
                  <div className="w-10 h-10 rounded-full bg-[#F6BD60] flex items-center justify-center text-lg font-bold text-[#2D2D2D]">2</div>
                  <h3 className="text-xl font-bold text-[#2D2D2D]">Сервис определит размеры и рассчитает стоимость доставки</h3>
                  <p className="text-sm text-[#2D2D2D]">Загрузи фотографию с компьютера или с телефона</p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-[340px] h-[380px] bg-[rgba(87,167,115,0.24)] rounded-2xl p-6 flex flex-col gap-6 rotate-3">
                  <div className="w-10 h-10 rounded-full bg-[#57A773] flex items-center justify-center text-lg font-bold text-white">3</div>
                  <h3 className="text-xl font-bold text-[#2D2D2D]">Если все устроит, курьер приедет к вам и заберет посылку</h3>
                  <p className="text-sm text-[#2D2D2D]">Загрузи фотографию с компьютера или с телефона</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6">
              <p className="text-lg font-bold text-[#2D2D2D] text-center">Рассчитайте стоимость и сроки посылки за несколько минут<br/>сразу во всех транспортных компаниях</p>
              <form className="w-full max-w-[800px] bg-white border border-[#C8C7CC] rounded-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex" onSubmit={handleCalculate}>
                <div className="flex-1 flex items-center px-6 py-4">
                  <CityInput
                    placeholder="Откуда"
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex items-center px-6 py-4 border-l border-[#C8C7CC]">
                  <CityInput
                    placeholder="Куда"
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center px-1.5">
                  <button type="submit" className="px-6 py-4 rounded-[10px] text-base font-semibold bg-[#0077FE] text-white whitespace-nowrap">Перейти к загрузке фото</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="w-full flex justify-center px-6 py-16">
        <div className="w-full max-w-[1128px] relative">
          <div className="bg-[#F4EEE2] rounded-2xl p-12 flex">
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-[40px] font-bold text-[#2D2D2D] leading-[1.1]">Экономьте<br/>время и деньги</h2>
                <p className="text-base text-[#2D2D2D] max-w-[400px]">PochtaHub это новый способ передавать посылки.<br/>Вы просто делаете фото, и получаете готовое решение. Делаем вашу доставку в 3 клика</p>
              </div>
              <button className="w-fit px-6 py-4 rounded-[10px] text-base font-semibold bg-[#0077FE] text-white">Получить расчет</button>
            </div>
            <div className="flex-1"></div>
          </div>
          <img src={aboutMain} alt="" className="absolute right-12 bottom-0 h-[320px]" />
          <img src={aboutBox1} alt="" className="absolute right-[380px] top-8 h-[80px]" />
          <img src={aboutBox2} alt="" className="absolute right-[80px] top-4 h-[60px]" />
          <img src={aboutBox3} alt="" className="absolute right-[200px] bottom-[100px] h-[50px]" />
        </div>
      </section>

      {/* Bullets */}
      <section className="w-full flex justify-center px-6 py-16">
        <div className="w-full max-w-[1128px] grid grid-cols-2 gap-6">
          <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F4F2F3] flex items-center justify-center">
              <img src={iconCheckCircle} alt="" className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#2D2D2D]">Все варианты доставки в одном месте</h3>
            <p className="text-sm text-[#2D2D2D]">Сразу видите предложения от проверенных транспортных компаний без перехода по разным сайтам.</p>
          </div>
          <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F4F2F3] flex items-center justify-center">
              <img src={iconCheckCircle} alt="" className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#2D2D2D]">Никакой головной боли</h3>
            <p className="text-sm text-[#2D2D2D]">Мы сами подберем надежную транспортную компанию под ваш маршрут и бюджет. Просто выберите готовое решение.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full flex justify-center px-6 py-12 mt-auto">
        <div className="w-full max-w-[1128px] flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#2D2D2D] cursor-pointer">Рассчитать доставку</span>
              <div className="w-px h-4 bg-[#C8C7CC]"></div>
              <span className="text-sm text-[#2D2D2D] cursor-pointer">Рассчитать в Telegram-боте</span>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-[#2D2D2D]">CDEK</span>
                <span className="text-sm text-[#2D2D2D]">Деловые Линии</span>
                <span className="text-sm text-[#2D2D2D]">DPD</span>
                <span className="text-sm text-[#2D2D2D]">Энергия</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-[#2D2D2D]">KCE</span>
                <span className="text-sm text-[#2D2D2D]">Почта России</span>
                <span className="text-sm text-[#2D2D2D]">Байкал Сервис</span>
                <span className="text-sm text-[#2D2D2D]">Boxberry</span>
              </div>
              <div className="ml-auto bg-white border border-[#C8C7CC] rounded-xl p-3 flex items-center gap-3">
                <img src={qrCode} alt="" className="w-12 h-12" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#2D2D2D]">@pochtahub_bot</span>
                  <span className="text-xs text-[#858585]">Наш телеграм бот</span>
                </div>
                <img src={iconTelegram} alt="" className="w-6 h-6" />
              </div>
            </div>
          </div>
            <img src={logosStrip} alt=""  />
          <div className="flex items-center gap-6">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
            <div className="flex items-center gap-1">
              <img src={iconVerify} alt="" className="w-6 h-6" />
              <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isAuthenticated ? (
                <Link to="/cabinet" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">Личный кабинет</Link>
              ) : (
                <button 
                  onClick={() => setShowLoginPopup(true)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                >
                  Войти
                </button>
              )}
              <button className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Рассчитать</button>
            </div>
          </div>
          <div className="flex gap-12 pt-6 border-t border-[#C8C7CC]">
            <div className="flex flex-col gap-2">
              <a href="#" className="text-xs text-[#858585]">Политика конфиденциальности и обработки ПД</a>
              <a href="#" className="text-xs text-[#858585]">Согласие на обработку ПД</a>
              <a href="#" className="text-xs text-[#858585]">Согласие на рассылку</a>
            </div>
            <div className="flex flex-col gap-2">
              <a href="#" className="text-xs text-[#858585]">Пользовательское соглашение</a>
              <a href="#" className="text-xs text-[#858585]">Политика cookie</a>
            </div>
            <div className="ml-auto flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-[#2D2D2D]">Наверх</span>
              <div className="w-10 h-10 rounded-full bg-[#F4F2F3] flex items-center justify-center text-base">↑</div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}

export default CalculatePage
