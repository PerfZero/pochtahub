import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import logoSvg from '../assets/whitelogo.svg'
import cdekIcon from '../assets/images/cdek.svg'
import CityInput from '../components/CityInput'
import NumberInput from '../components/NumberInput'
import { tariffsAPI } from '../api'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const getMediaUrl = (path) => {
  if (path.startsWith('http')) return path
  if (path.startsWith('/media')) {
    if (API_URL.startsWith('http')) {
      // Если API_URL полный URL (например, http://127.0.0.1:8000/api), используем его базовый URL
      return `${API_URL.replace('/api', '')}${path}`
    }
    // Если API_URL относительный (/api), определяем базовый URL
    // Для локальной разработки обычно бэкенд на 127.0.0.1:8000
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalDev && window.location.port !== '8000') {
      return `http://127.0.0.1:8000${path}`
    }
    return `${window.location.origin}${path}`
  }
  return path
}
import assistantAvatar from '../assets/images/assistant-avatar-336dfe.png'
import iconPhone from '../assets/images/icon-phone.svg'
import iconIron from '../assets/images/icon-iron.svg'
import iconShoes from '../assets/images/icon-shoes.svg'
import iconMicrowave from '../assets/images/icon-microwave.svg'

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
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [error, setError] = useState('')
  const [filterCourierPickup, setFilterCourierPickup] = useState(false)
  const [filterCourierDelivery, setFilterCourierDelivery] = useState(false)
  const [sortBy, setSortBy] = useState('price')
  const [shareSuccess, setShareSuccess] = useState(false)
  const [showAssistant, setShowAssistant] = useState(true)
  const [typedText, setTypedText] = useState('')
  const [assistantStep, setAssistantStep] = useState('initial')
  const [isThinking, setIsThinking] = useState(true)
  const [showPackagePopup, setShowPackagePopup] = useState(false)
  const [packageOption, setPackageOption] = useState(null)
  const [selectedPackageOption, setSelectedPackageOption] = useState(null)
  const [recalculating, setRecalculating] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [selectedSize, setSelectedSize] = useState(null)
  
  const assistantMessageInitial = 'Привет! Я виртуальный ассистент Саша. Я помогу оформить доставку без лишних действий. Хотите, чтобы получатель сам выбрал доставку и указал точный адрес?'
  const assistantMessageSecond = 'Я помогу быстро отправить или получить посылку. Представленный расчёт ниже, сейчас ориентировочный. Хотите сделать его точнее?'
  const assistantMessageSuccess = 'Отлично! Теперь мы можем посчитать точную стоимость вашей посылки. Выберите наиболее подходящее предложение ниже.'
  
  const getCurrentMessage = () => {
    if (selectedPackageOption) {
      return assistantMessageSuccess
    }
    return assistantStep === 'initial' ? assistantMessageInitial : assistantMessageSecond
  }
  
  const currentMessage = getCurrentMessage()
  
  const sizeOptions = [
    {
      id: 'smartphone',
      name: 'Как коробка от смартфона',
      dimensions: '17х12х9 см',
      weight: 'до 1 кг',
      icon: iconPhone
    },
    {
      id: 'iron',
      name: 'Как коробка от утюга',
      dimensions: '21х20х11 см',
      weight: 'до 3 кг',
      icon: iconIron
    },
    {
      id: 'shoes',
      name: 'Как коробка от обуви',
      dimensions: '33х25х15 см',
      weight: 'до 7 кг',
      icon: iconShoes
    },
    {
      id: 'microwave',
      name: 'Как коробка от микроволновки',
      dimensions: '42х35х30 см',
      weight: 'до 15кг',
      icon: iconMicrowave
    }
  ]
  
  const handlePackageContinue = async () => {
    setRecalculating(true)
    setShowPackagePopup(false)
    
    if (packageOption === 'photo' && photoPreview) {
      let finalWeight = '1'
      let finalLength = ''
      let finalWidth = ''
      let finalHeight = ''
      
      if (photoFile) {
        try {
          const formData = new FormData()
          formData.append('image', photoFile)
          const response = await tariffsAPI.analyzeImage(formData)
          if (response.data) {
            finalWeight = response.data.weight || '1'
            finalLength = response.data.length || ''
            finalWidth = response.data.width || ''
            finalHeight = response.data.height || ''
          }
        } catch (err) {
          console.error('Ошибка анализа изображения:', err)
        }
      }
      
      const updatedWizardData = {
        ...wizardData,
        weight: finalWeight,
        length: finalLength,
        width: finalWidth,
        height: finalHeight,
        packageOption: 'photo',
        photoFile
      }
      
      setWizardData(updatedWizardData)
      setSelectedPackageOption('photo')
      
      try {
        const response = await tariffsAPI.calculate({
          weight: parseFloat(finalWeight),
          length: parseFloat(finalLength) || 0,
          width: parseFloat(finalWidth) || 0,
          height: parseFloat(finalHeight) || 0,
          from_city: updatedWizardData.fromCity,
          to_city: updatedWizardData.toCity,
          from_address: updatedWizardData.senderAddress || updatedWizardData.fromCity,
          to_address: updatedWizardData.deliveryAddress || updatedWizardData.toCity,
        })
        
        if (response.data && response.data.options) {
          setOffers(response.data.options)
        }
      } finally {
        setRecalculating(false)
      }
    } else if (packageOption === 'manual' && length && width && height && weight) {
      const updatedWizardData = {
        ...wizardData,
        weight,
        length,
        width,
        height,
        packageOption: 'manual'
      }
      
      setWizardData(updatedWizardData)
      setSelectedPackageOption('manual')
      
      try {
        const response = await tariffsAPI.calculate({
          weight: parseFloat(weight),
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          from_city: updatedWizardData.fromCity,
          to_city: updatedWizardData.toCity,
          from_address: updatedWizardData.senderAddress || updatedWizardData.fromCity,
          to_address: updatedWizardData.deliveryAddress || updatedWizardData.toCity,
        })
        
        if (response.data && response.data.options) {
          setOffers(response.data.options)
        }
      } finally {
        setRecalculating(false)
      }
    } else if (packageOption === 'unknown' && selectedSize) {
      const sizeOption = sizeOptions.find(opt => opt.id === selectedSize)
      let finalWeight = '1'
      let finalLength = ''
      let finalWidth = ''
      let finalHeight = ''
      
      if (sizeOption) {
        const weightMatch = sizeOption.weight.match(/(\d+)/)
        finalWeight = weightMatch ? weightMatch[1] : '5'
        const dimMatch = sizeOption.dimensions.match(/(\d+)х(\d+)х(\d+)/)
        if (dimMatch) {
          finalLength = dimMatch[1]
          finalWidth = dimMatch[2]
          finalHeight = dimMatch[3]
        }
      }
      
      const updatedWizardData = {
        ...wizardData,
        weight: finalWeight,
        length: finalLength,
        width: finalWidth,
        height: finalHeight,
        selectedSize,
        packageOption: 'unknown'
      }
      
      setWizardData(updatedWizardData)
      setSelectedPackageOption('unknown')
      
      try {
        const response = await tariffsAPI.calculate({
          weight: parseFloat(finalWeight),
          length: parseFloat(finalLength),
          width: parseFloat(finalWidth),
          height: parseFloat(finalHeight),
          from_city: updatedWizardData.fromCity,
          to_city: updatedWizardData.toCity,
          from_address: updatedWizardData.senderAddress || updatedWizardData.fromCity,
          to_address: updatedWizardData.deliveryAddress || updatedWizardData.toCity,
        })
        
        if (response.data && response.data.options) {
          setOffers(response.data.options)
        }
      } finally {
        setRecalculating(false)
      }
    } else {
      setRecalculating(false)
    }
  }
  
  const isPhotoValid = packageOption === 'photo' && photoPreview
  const isManualValid = packageOption === 'manual' && length && width && height && weight
  const isUnknownValid = packageOption === 'unknown' && selectedSize
  const isContinueDisabled = !isPhotoValid && !isManualValid && !isUnknownValid
  
  const isFromUrl = !location.state?.wizardData && location.search.includes('data=')
  
  useEffect(() => {
    if (showAssistant) {
      setIsThinking(true)
      setTypedText('')
      
      const thinkingTimeout = setTimeout(() => {
        setIsThinking(false)
      }, 1000)
      
      return () => clearTimeout(thinkingTimeout)
    }
  }, [showAssistant, assistantStep, selectedPackageOption])
  
  useEffect(() => {
    if (showAssistant && !isThinking && typedText.length < currentMessage.length) {
      const timeout = setTimeout(() => {
        setTypedText(currentMessage.slice(0, typedText.length + 1))
      }, 15)
      return () => clearTimeout(timeout)
    }
  }, [showAssistant, typedText, currentMessage, isThinking])

  useEffect(() => {
    if (fromCity || toCity) {
      setWizardData(prev => ({
        ...prev,
        fromCity,
        toCity,
      }))
    }
  }, [fromCity, toCity])

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
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
        })

        console.log('Ответ API расчета тарифов:', response.data)
        
        if (response.data && response.data.options) {
          console.log('Найдено предложений:', response.data.options.length)
          setOffers(response.data.options)
        } else {
          console.error('Нет предложений в ответе:', response.data)
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
    const updatedWizardData = {
      ...wizardData,
      fromCity: wizardData.fromCity || fromCity,
      toCity: wizardData.toCity || toCity,
      selectedOffer: {
        company_id: offer.company_id,
        company_name: offer.company_name,
        company_code: offer.company_code,
        price: offer.price,
        tariff_code: offer.tariff_code,
        tariff_name: offer.tariff_name,
        delivery_time: offer.delivery_time,
      }
    }
    navigate('/wizard', {
      state: updatedWizardData
    })
  }

  const handleCalculate = useCallback(async () => {
    if (!fromCity || !toCity || !wizardData.weight) {
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const updatedWizardData = {
        ...wizardData,
        fromCity,
        toCity,
      }

      setWizardData(updatedWizardData)

      const dimensions = {
        length: updatedWizardData.length || 0,
        width: updatedWizardData.width || 0,
        height: updatedWizardData.height || 0,
      }
      
      const response = await tariffsAPI.calculate({
        weight: parseFloat(updatedWizardData.weight),
        ...dimensions,
        from_city: fromCity,
        to_city: toCity,
        from_address: updatedWizardData.senderAddress || fromCity,
        to_address: updatedWizardData.deliveryAddress || toCity,
        courier_pickup: filterCourierPickup,
        courier_delivery: filterCourierDelivery,
      })

      console.log('Ответ API расчета тарифов (handleCalculate):', response.data)
      
      if (response.data && response.data.options) {
        console.log('Найдено предложений:', response.data.options.length)
        setOffers(response.data.options)
      } else {
        console.error('Нет предложений в ответе:', response.data)
        setError('Не удалось получить предложения')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки предложений')
    } finally {
      setLoading(false)
    }
  }, [fromCity, toCity, wizardData, filterCourierPickup, filterCourierDelivery])

  // Пересчет тарифов при изменении фильтров доставки
  useEffect(() => {
    if (!wizardData?.weight || !fromCity || !toCity || offers.length === 0) {
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsRecalculating(true)
        setError('')
        
        const dimensions = {
          length: wizardData.length || 0,
          width: wizardData.width || 0,
          height: wizardData.height || 0,
        }
        
        const response = await tariffsAPI.calculate({
          weight: parseFloat(wizardData.weight),
          ...dimensions,
          from_city: fromCity,
          to_city: toCity,
          from_address: wizardData.senderAddress || fromCity,
          to_address: wizardData.deliveryAddress || toCity,
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
        })

        if (response.data && response.data.options) {
          setOffers(response.data.options)
        } else {
          setError('Не удалось получить предложения')
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Ошибка загрузки предложений')
      } finally {
        setIsRecalculating(false)
      }
    }, 300) // Debounce 300ms
    
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCourierPickup, filterCourierDelivery])

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
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-8" />
        </Link>
        <div className="w-full max-w-[720px] bg-white rounded-2xl flex items-stretch  p-2">
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
          <button 
            onClick={handleCalculate}
            disabled={!fromCity || !toCity || !wizardData.weight || loading}
            className="bg-[#0077FE] text-white px-4 py-2 text-base font-semibold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Расчет...' : 'Рассчитать стоимость'}
          </button>
        </div>
      </header>

      {showPackagePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-[468px] w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowPackagePopup(false)
                setPackageOption(null)
                setPhotoFile(null)
                setPhotoPreview(null)
                setPhotoError('')
                setLength('')
                setWidth('')
                setHeight('')
                setWeight('')
                setSelectedSize(null)
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
            
            {packageOption === 'photo' && (
              <div className="p-8">
                <h2 className="text-3xl font-bold text-[#2D2D2D] mb-8 text-center">
                  Загрузить фото
                </h2>
                
                <div className="mb-6">
                  <div className="border-2 border-dashed border-[#0077FE] rounded-xl p-8 mb-6">
                    {!photoPreview ? (
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-[#2D2D2D]">Фотография весом не более 5 мб.</p>
                        <input
                          type="file"
                          id="photo-upload-popup"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                setPhotoError('Файл слишком большой. Максимальный размер 5 МБ.')
                                setPhotoFile(null)
                                setPhotoPreview(null)
                              } else {
                                setPhotoFile(file)
                                setPhotoError('')
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  setPhotoPreview(reader.result)
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="photo-upload-popup"
                          className="px-6 py-3 bg-[#0077FE] text-white rounded-xl text-base font-semibold cursor-pointer hover:bg-[#0066CC] transition-colors"
                        >
                          Загрузить фото
                        </label>
                        {photoError && (
                          <p className="text-sm text-red-500">{photoError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative inline-block">
                          <img
                            src={photoPreview}
                            alt="Загруженное фото"
                            className="max-w-full h-auto rounded-lg max-h-64"
                          />
                          <button
                            onClick={() => {
                              setPhotoFile(null)
                              setPhotoPreview(null)
                              setPhotoError('')
                              const input = document.getElementById('photo-upload-popup')
                              if (input) input.value = ''
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-[#2D2D2D] text-lg font-bold">×</span>
                          </button>
                        </div>
                        <div className="mt-4 text-center">
                          <input
                            type="file"
                            id="photo-replace-popup"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  setPhotoError('Файл слишком большой. Максимальный размер 5 МБ.')
                                } else {
                                  setPhotoFile(file)
                                  setPhotoError('')
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    setPhotoPreview(reader.result)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="photo-replace-popup"
                            className="text-sm text-[#0077FE] cursor-pointer hover:underline"
                          >
                            Загрузить другое фото
                          </label>
                        </div>
                        {photoError && (
                          <p className="text-sm text-red-500 mt-2 text-center">{photoError}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handlePackageContinue}
                    disabled={isContinueDisabled}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0077FE]"
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            )}
            
            {packageOption === 'manual' && (
              <div className="p-8">
                  <h2 className="text-3xl font-bold text-[#2D2D2D] mb-8">
                    Указать точные размеры
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <NumberInput
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      label="Длина, см"
                    />
                    <NumberInput
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      label="Высота, см"
                    />
                    <NumberInput
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      label="Ширина, см"
                    />
                    <NumberInput
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      label="Вес, кг"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <NumberInput
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                      label="Оценочная стоимость"
                    />
                  </div>
                  
                  <div className="mb-6 text-center">
                    <button
                      onClick={() => {
                        setPackageOption('unknown')
                        setLength('')
                        setWidth('')
                        setHeight('')
                        setWeight('')
                      }}
                      className="text-sm text-[#0077FE] hover:underline"
                    >
                      Не знаю габариты
                    </button>
                  </div>
                  
                  <button
                    onClick={handlePackageContinue}
                    disabled={isContinueDisabled}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0077FE]"
                  >
                    Продолжить
                  </button>
                </div>
              )}
            
            {packageOption === 'unknown' && (
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-[#2D2D2D] mb-8">
                    Указать точные размеры
                  </h2>
                  
                  <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4 mb-6">
                    {sizeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedSize(option.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedSize === option.id
                            ? 'border-[#0077FE] bg-[#F0F7FF]'
                            : 'border-[#E5E5E5] bg-white hover:border-[#0077FE]'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 flex items-center justify-center">
                            <img src={option.icon} alt="" className="w-full h-full" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-[#2D2D2D] mb-1">{option.name}</p>
                            <p className="text-xs text-[#2D2D2D]">{option.dimensions}</p>
                            <p className="text-xs text-[#2D2D2D]">{option.weight}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <NumberInput
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                      label="Оценочная стоимость"
                    />
                  </div>
                  
                  <div className="mb-6 text-center">
                    <button
                      onClick={() => {
                        setPackageOption('manual')
                        setSelectedSize(null)
                      }}
                      className="text-sm text-[#0077FE] hover:underline"
                    >
                      Я знаю габариты
                    </button>
                  </div>
                  
                  <button
                    onClick={handlePackageContinue}
                    disabled={isContinueDisabled}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0077FE]"
                  >
                    Продолжить
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
      
      <div className="flex justify-center pt-12 pb-8">
        <div className="w-full max-w-[720px] mx-6">
          {showAssistant && (
            <div className="bg-white rounded-2xl   px-4 py-4 mb-6 flex gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <img src={assistantAvatar} alt="Саша" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#2D2D2D]">Ассистент Саша</p>
                <div className="bg-[#F9F6F0] rounded-tl-[5px] rounded-tr-[12px] rounded-bl-[8px] rounded-br-[8px] px-3 py-2 mb-1">
                  <p className="text-base text-[#2D2D2D]">
                    {recalculating ? 'Пересчитываем предложения...' : isThinking ? (
                      <span className="inline-flex gap-1">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                      </span>
                    ) : (
                      <>
                        {typedText}
                        {typedText.length < currentMessage.length && (
                          <span className="inline-block w-0.5 h-4 bg-[#2D2D2D] ml-1 animate-pulse"></span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                {recalculating ? null : assistantStep === 'initial' ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/wizard', {
                          state: {
                            fromCity: wizardData.fromCity || fromCity,
                            toCity: wizardData.toCity || toCity,
                            inviteRecipient: true,
                            selectedRole: 'sender'
                          }
                        })
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] rounded-br-[12px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      🤝 Да, пригласить получателя
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssistantStep('second')
                        setTypedText('')
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[12px] rounded-br-[8px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📦 Нет, оформлю сам
                    </button>
                  </div>
                ) : selectedPackageOption === 'photo' ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPackageOption('photo')
                        setShowPackagePopup(true)
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] rounded-br-[12px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📸 Загрузить другое фото
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageOption('manual')
                        setShowPackagePopup(true)
                        setLength('')
                        setWidth('')
                        setHeight('')
                        setWeight('')
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[12px] rounded-br-[8px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📐 Указать точные размеры
                    </button>
                  </div>
                ) : selectedPackageOption === 'manual' ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPackageOption('photo')
                        setShowPackagePopup(true)
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] rounded-br-[12px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📸 Загрузить фото посылки
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageOption('manual')
                        setShowPackagePopup(true)
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[12px] rounded-br-[8px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📐 Указать другие размеры
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPackageOption('photo')
                        setShowPackagePopup(true)
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] rounded-br-[12px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📸 Загрузить фото посылки
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageOption('manual')
                        setShowPackagePopup(true)
                      }}
                      className="flex-1 bg-[#F4EEE2] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[12px] rounded-br-[8px] px-3 py-2 text-base text-[#2D2D2D] hover:bg-[#E8DDC8] transition-colors"
                    >
                      📐 Указать точные размеры
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className=" rounded-2xl 8 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-3xl text-center font-bold text-[#2D2D2D]">
              Предложения по вашим параметрам 🔥
              </h1>
            </div>
            <p className="text-base text-center text-[#2D2D2D] mb-6">
            Выберите наиболее подходящий вариант доставки 👇
            </p>

            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#C8C7CC] rounded-full px-4 py-2 transition-shadow">
                <span className="text-sm text-[#2D2D2D]">Курьер забирает</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filterCourierPickup}
                    onChange={(e) => {
                      setFilterCourierPickup(e.target.checked)
                    }}
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
                    onChange={(e) => {
                      setFilterCourierDelivery(e.target.checked)
                    }}
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
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative flex items-center justify-between flex-row rounded-xl p-6 border-b-4 border-[#add3ff] rounded-b-2xl bg-white animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div>
                        <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
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
              <div className="relative pt-4">
                {isRecalculating && (
                  <div className="absolute inset-0 top-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-[#0077FE] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-[#858585]">Пересчитываем...</p>
                    </div>
                  </div>
                )}
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
                          {offer.company_logo ? (
                            <img 
                              src={getMediaUrl(offer.company_logo)} 
                              alt={offer.company_name} 
                              className="w-12 h-12 object-contain" 
                            />
                          ) : isCDEK ? (
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

                      {!isFromUrl && (
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
                      )}
                    </div>
                  )
                })}
                </div>
              </div>
            )}
          </div>

          {!isFromUrl && (
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
          )}
        </div>
      </div>
    </div>
  )
}

export default OffersPage
