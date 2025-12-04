import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { tariffsAPI } from '../api'
import CityInput from '../components/CityInput'

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
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('access_token')

  const handleCalculate = async (e) => {
    e.preventDefault()
    if (!fromCity || !toCity) {
      alert('Заполните поля откуда и куда')
      return
    }
    setLoading(true)
    setOptions([])
    
    try {
      const calculateData = {
        weight: 1,
        from_city: fromCity,
        to_city: toCity,
        from_address: fromCity,
        to_address: toCity,
      }
      
      const response = await tariffsAPI.calculate(calculateData)
      const optionsData = response.data?.options || []
      
      if (optionsData.length > 0) {
        setOptions(optionsData)
      } else {
        alert('Нет доступных вариантов доставки')
      }
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCompany = (company) => {
    navigate('/order', {
      state: {
        company,
        weight: 1,
        fromAddress: fromCity,
        toAddress: toCity,
        fromCity: fromCity,
        toCity: toCity,
      },
    })
  }

  const handleNewCalculation = () => {
    setOptions([])
    setFromCity('')
    setToCity('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#F4EEE2] border-t-[#0077FE] rounded-full animate-spin"></div>
          <p className="text-[#2D2D2D]">Рассчитываем стоимость доставки...</p>
        </div>
      </div>
    )
  }

  if (options.length > 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="flex justify-center items-center p-6">
          <div className="w-full max-w-[1128px] flex items-center gap-6">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
            <div className="flex items-center gap-1">
              <img src={iconVerify} alt="" className="w-6 h-6" />
              <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link to={isAuthenticated ? "/cabinet" : "/login"} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">{isAuthenticated ? "Личный кабинет" : "Войти"}</Link>
              <button onClick={handleNewCalculation} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Новый расчёт</button>
            </div>
          </div>
        </header>

        <section className="px-6 py-12">
          <div className="max-w-[1128px] mx-auto">
            <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">Варианты доставки</h2>
            <p className="text-lg text-[#858585] mb-8">{fromCity} → {toCity}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {options.map((option, index) => (
                <div key={`${option.company_id}-${option.tariff_code || index}`} className="bg-white border border-[#C8C7CC] rounded-2xl p-6 relative">
                  {index === 0 && <span className="absolute -top-3 left-6 bg-[#0077FE] text-white text-xs font-semibold px-3 py-1 rounded-full">Лучшая цена</span>}
                  <h3 className="text-xl font-bold text-[#2D2D2D] mb-1">{option.company_name}</h3>
                  {option.tariff_name && <p className="text-sm text-[#858585] mb-4">{option.tariff_name}</p>}
                  <div className="text-3xl font-bold text-[#0077FE] mb-1">{option.price} ₽</div>
                  {option.delivery_time && <div className="text-sm text-[#858585] mb-4">{option.delivery_time} дн.</div>}
                  <button onClick={() => handleSelectCompany(option)} className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white">
                    Оформить отправку
                  </button>
                  <p className="text-xs text-[#858585] mt-3">Мы подготовим отправление. Вы просто сдаете его в ближайшем ПВЗ</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
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
          <img src={logoSvg} alt="PochtaHub" className="h-8" />
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to={isAuthenticated ? "/cabinet" : "/login"} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">{isAuthenticated ? "Личный кабинет" : "Войти"}</Link>
            <button className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Рассчитать</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full flex justify-center px-6">
        <div className="w-full max-w-[1128px] border border-[#C8C7CC] rounded-2xl overflow-hidden">
          <div className="bg-[#EEE5D3] py-2 flex items-center justify-center">
            <img src={logosStrip} alt=""  />
          </div>
          <div className="bg-[#F9F6F0] px-[72px] py-0 flex items-center justify-center gap-8">
            <div className="flex-1 flex flex-col justify-center gap-6 py-12">
              <h1 className="text-[48px] font-bold leading-[1.1] text-[#2D2D2D]">Сфотографируй посылку и <br /> получи расчёт доставки</h1>
              <p className="text-lg text-[#2D2D2D]">Без регистрации, без замеров, просто фото</p>
            </div>
            <div className="shrink-0">
              <img src={heroConcept} alt="" className="h-[428px]" />
            </div>
          </div>
          <form className="bg-white border-t border-[#C8C7CC] shadow-[0_4px_8px_0_rgba(0,0,0,0.08)] bg-white flex" onSubmit={handleCalculate}>
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
            <div className="flex items-center w-full max-w-[364px]   justify-center p-1.5">
              <button type="submit" className="px-6 py-4 w-full max-w-[364px] rounded-[10px] text-base font-semibold bg-[#0077FE] text-white whitespace-nowrap">Рассчитать стоимость</button>
            </div>
          </form>
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
              <Link to={isAuthenticated ? "/cabinet" : "/login"} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">{isAuthenticated ? "Личный кабинет" : "Войти"}</Link>
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
  )
}

export default CalculatePage
