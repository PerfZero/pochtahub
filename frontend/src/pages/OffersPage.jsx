import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import logoSvg from '../assets/whitelogo.svg'
import cdekIcon from '../assets/images/cdek.svg'
import CityInput from '../components/CityInput'
import { tariffsAPI } from '../api'

function OffersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const getUrlWizardData = () => {
    const urlParams = new URLSearchParams(location.search)
    const encoded = urlParams.get('data')
    
    if (encoded) {
      try {
        const decodedBase64 = decodeURIComponent(encoded)
        const binaryString = atob(decodedBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const decoded = new TextDecoder('utf-8').decode(bytes)
        return JSON.parse(decoded)
      } catch (err) {
        console.error('Ошибка декодирования данных:', err)
        return {}
      }
    }
    
    return {}
  }
  
  const [wizardData, setWizardData] = useState(() => {
    return location.state?.wizardData || getUrlWizardData()
  })
  
  const [fromCity, setFromCity] = useState(wizardData.fromCity || '')
  const [toCity, setToCity] = useState(wizardData.toCity || '')
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterCourierPickup, setFilterCourierPickup] = useState(false)
  const [filterCourierDelivery, setFilterCourierDelivery] = useState(true)
  const [sortBy, setSortBy] = useState('price')
  const [shareSuccess, setShareSuccess] = useState(false)

  useEffect(() => {
    let currentWizardData = wizardData
    
    if (location.state?.wizardData) {
      currentWizardData = location.state.wizardData
      setWizardData(currentWizardData)
      setFromCity(currentWizardData.fromCity || '')
      setToCity(currentWizardData.toCity || '')
    } else if (location.search) {
      const urlData = getUrlWizardData()
      if (urlData.fromCity || urlData.toCity) {
        currentWizardData = urlData
        setWizardData(urlData)
        setFromCity(urlData.fromCity || '')
        setToCity(urlData.toCity || '')
      }
    }
    
    const loadOffers = async () => {
      if (!currentWizardData.weight || !currentWizardData.fromCity || !currentWizardData.toCity) {
        setError('Недостаточно данных для расчета')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const dimensions = {
          length: currentWizardData.length || 0,
          width: currentWizardData.width || 0,
          height: currentWizardData.height || 0,
        }
        
        const response = await tariffsAPI.calculate({
          weight: parseFloat(currentWizardData.weight),
          ...dimensions,
          from_city: currentWizardData.fromCity,
          to_city: currentWizardData.toCity,
          from_address: currentWizardData.senderAddress || currentWizardData.fromCity,
          to_address: currentWizardData.deliveryAddress || currentWizardData.toCity,
        })

        if (response.data && response.data.options) {
          setOffers(response.data.options)
        } else {
          setError('Не удалось получить предложения')
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Ошибка загрузки предложений')
      } finally {
        setLoading(false)
      }
    }

    loadOffers()
  }, [location.search, location.state])

  const getCompanyInitial = (name) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const getCompanyColor = (index) => {
    const colors = [
      'bg-green-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-blue-500',
    ]
    return colors[index % colors.length]
  }

  const sortedOffers = [...offers].sort((a, b) => {
    if (sortBy === 'price') {
      return (a.price || 0) - (b.price || 0)
    } else if (sortBy === 'delivery_time') {
      return (a.delivery_time || 0) - (b.delivery_time || 0)
    }
    return 0
  })

  const cheapestOffer = sortedOffers.length > 0 ? sortedOffers[0] : null
  const fastestOffer = [...offers].sort((a, b) => (a.delivery_time || 999) - (b.delivery_time || 999))[0]

  const handleSelectOffer = (offer) => {
    navigate('/payment', {
      state: {
        wizardData,
        company: offer.company_id,
        companyName: offer.company_name,
        price: offer.price,
        tariffCode: offer.tariff_code,
        deliveryTime: offer.delivery_time,
      }
    })
  }

  const handleShare = async () => {
    try {
      const shareData = {
        fromCity: wizardData.fromCity || fromCity,
        toCity: wizardData.toCity || toCity,
        weight: wizardData.weight || '',
        length: wizardData.length || '',
        width: wizardData.width || '',
        height: wizardData.height || '',
        senderAddress: wizardData.senderAddress || '',
        deliveryAddress: wizardData.deliveryAddress || '',
      }
      
      const jsonString = JSON.stringify(shareData)
      const bytes = new TextEncoder().encode(jsonString)
      let binaryString = ''
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binaryString)
      const encoded = encodeURIComponent(base64)
      const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`
      await navigator.clipboard.writeText(url)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-6 py-6 gap-6">
        <img src={logoSvg} alt="PochtaHub" className="h-8" />
        <div className="w-full max-w-[720px] bg-white rounded-2xl flex items-stretch overflow-hidden p-2">
          <div className="flex-1 px-6 py-2 border-r border-[#E5E5E5]">
            <CityInput
              placeholder="Откуда"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              variant="hero"
              label="Откуда"
            />
          </div>
          <div className="flex-1 px-6 py-2">
            <CityInput
              placeholder="Куда"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              variant="hero"
              label="Куда"
            />
          </div>
          <button className="bg-[#0077FE] text-white px-4 py-2 text-base font-semibold whitespace-nowrap rounded-xl">
            Рассчитать стоимость
          </button>
        </div>
      </header>

      <div className="flex justify-center pt-12 pb-8">
        <div className="w-full max-w-[720px] mx-6">
          <div className=" rounded-2xl 8 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl text-center font-bold text-[#2D2D2D]">
                Подобрали лучшие предложения по вашим параметрам
              </h1>
            </div>
            <p className="text-base text-center text-[#2D2D2D] mb-6">
            Выберите и оформите наиболее подходящий вариант доставки 👇
            </p>

            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#C8C7CC] rounded-full px-4 py-2 transition-shadow">
                <span className="text-sm text-[#2D2D2D]">Курьер забирает</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filterCourierPickup}
                    onChange={(e) => setFilterCourierPickup(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                    filterCourierPickup ? 'bg-[#0077FE]' : 'bg-[#E5E5E5]'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 translate-y-0.5 ${
                      filterCourierPickup ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#C8C7CC] rounded-full px-4 py-2 transition-shadow">
                <span className="text-sm text-[#2D2D2D]">Курьер привезет</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filterCourierDelivery}
                    onChange={(e) => setFilterCourierDelivery(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                    filterCourierDelivery ? 'bg-[#0077FE]' : 'bg-[#E5E5E5]'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 translate-y-0.5 ${
                      filterCourierDelivery ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </div>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="ml-auto px-4 py-2 border border-[#C8C7CC] rounded-xl text-sm text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
              >
                <option value="price">По наилучшей цене</option>
                <option value="delivery_time">По скорости доставки</option>
              </select>
            </div>

            {loading && (
              <div className="text-center py-12">
                <p className="text-[#858585]">Загрузка предложений...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && sortedOffers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#858585]">Предложения не найдены</p>
              </div>
            )}

            {!loading && !error && sortedOffers.length > 0 && (
              <div className="space-y-4">
                {sortedOffers.map((offer, index) => {
                  const isCheapest = offer === cheapestOffer
                  const isFastest = offer === fastestOffer
                  const isCDEK = offer.company_name === 'CDEK' || offer.company_code === 'cdek'
                  
                  return (
                    <div
                      key={`${offer.company_id}-${offer.tariff_code || index}`}
                      className="relative flex items-center justify-between flex-row rounded-xl p-6 hover:shadow-lg transition-shadow border-b-4 border-[#add3ff] rounded-b-2xl bg-white"
                    >
                      {(isCheapest || isFastest) && (
                        <div className="absolute -top-3 left-4 z-10">
                          {isCheapest && (
                            <span className="px-3 py-1  bg-[#35c353] text-white rounded-full text-xs font-semibold ">
                              Самый дешевый
                            </span>
                          )}
                          {isFastest && !isCheapest && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold shadow-md">
                              Самый быстрый
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {isCDEK ? (
                            <img src={cdekIcon} alt="CDEK" className="w-12 h-12" />
                          ) : (
                            <div className={`w-12 h-12 rounded-full ${getCompanyColor(index)} flex items-center justify-center text-white text-lg font-bold`}>
                              {getCompanyInitial(offer.company_name)}
                            </div>
                          )}
                          <div>
                            <p className="text-lg font-bold text-[#2D2D2D]">
                              {offer.price ? Number(offer.price).toLocaleString('ru-RU') : '?'}₽
                            </p>
                            <p className="text-sm text-[#858585]">
                              {offer.delivery_time_min && offer.delivery_time_max
                                ? `Доставка за ${offer.delivery_time_min}-${offer.delivery_time_max} дн.`
                                : offer.delivery_time
                                ? `Доставка за ${offer.delivery_time} ${offer.delivery_time === 1 ? 'дн.' : 'дн.'}`
                                : 'Срок доставки уточняется'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ">
                        {filterCourierPickup && (
                          <span className="text-xs
 text-[#2D2D2D] flex items-center gap-1">
                            <span className="text-green-500">✓</span> Курьер забирает
                          </span>
                        )}
                        {filterCourierDelivery && (
                          <span className="text-xs
 text-[#2D2D2D] flex items-center gap-1">
                            <span className="text-green-500">✓</span> Курьер привезет
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectOffer(offer)}
                        className={` px-3 py-3 rounded-xl font-size-14px font-semibold transition-colors rounded-8px px-16px w-171px h-40px text-sm
 ${
                          isCheapest || isFastest
                            ? 'bg-[#0077FE] text-white hover:bg-[#0066CC]'
                            : 'bg-[#F5F5F5] text-[#2D2D2D] hover:bg-[#E5E5E5]'
                        }`}
                      >
                        Оформить отправку
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 relative">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">
              Сомневаешься что выбрать?
            </h2>
            <p className="text-base text-[#2D2D2D] mb-6">
              Поделись расчётом с получателем, он сам выберет
            </p>
            <button 
              onClick={handleShare}
              className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors"
            >
              {shareSuccess ? 'Ссылка скопирована!' : 'Поделиться расчётом'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OffersPage
