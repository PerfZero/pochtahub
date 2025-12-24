import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import logoSvg from '../assets/whitelogo.svg'
import CityInput from '../components/CityInput'
import NumberInput from '../components/NumberInput'
import PhoneInput from '../components/PhoneInput'
import AddressInput from '../components/AddressInput'
import CodeInput from '../components/CodeInput'
import { authAPI, tariffsAPI } from '../api'
import iconPhone from '../assets/images/icon-phone.svg'
import iconIron from '../assets/images/icon-iron.svg'
import iconShoes from '../assets/images/icon-shoes.svg'
import iconMicrowave from '../assets/images/icon-microwave.svg'

function WizardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { fromCity: initialFromCity, toCity: initialToCity, inviteRecipient, selectedRole: initialSelectedRole } = location.state || {}
  const [fromCity, setFromCity] = useState(initialFromCity || '')
  const [toCity, setToCity] = useState(initialToCity || '')
  const [selectedRole, setSelectedRole] = useState(initialSelectedRole || null)
  const [packageOption, setPackageOption] = useState(null)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [selectedSize, setSelectedSize] = useState(null)
  const [packageDataCompleted, setPackageDataCompleted] = useState(() => {
    return inviteRecipient && initialSelectedRole === 'sender'
  })
  const [senderPhone, setSenderPhone] = useState('')
  const [senderFIO, setSenderFIO] = useState('')
  const [senderAddress, setSenderAddress] = useState(initialFromCity || '')
  const [deliveryAddress, setDeliveryAddress] = useState(initialToCity || '')
  const [userPhone, setUserPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [telegramSent, setTelegramSent] = useState(false)
  const [paymentPayer, setPaymentPayer] = useState(null)
  const [currentStep, setCurrentStep] = useState(() => {
    if (location.state?.currentStep) {
      return location.state.currentStep
    }
    
    if (location.state?.selectedOffer || location.state?.wizardData?.selectedOffer) {
      return 'email'
    }
    
    try {
      const urlParams = new URLSearchParams(location.search)
      const encoded = urlParams.get('data')
      if (encoded) {
        const decodedBase64 = decodeURIComponent(encoded)
        const binaryString = atob(decodedBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const decoded = new TextDecoder('utf-8').decode(bytes)
        const wizardDataFromUrl = JSON.parse(decoded)
        if (wizardDataFromUrl?.selectedOffer) {
          return 'email'
        }
      }
    } catch (err) {
    }
    
    if (inviteRecipient && initialSelectedRole === 'sender') {
      return 'recipientPhone'
    }
    return 'package'
  })
  const [fioFocused, setFioFocused] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState(null)
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState(initialToCity || '')
  const [recipientFIO, setRecipientFIO] = useState('')
  const [recipientFioFocused, setRecipientFioFocused] = useState(false)
  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [agreePersonalData, setAgreePersonalData] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupSenderName, setPickupSenderName] = useState('')
  const [pickupSenderNameFocused, setPickupSenderNameFocused] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(location.state?.selectedOffer || null)
  const [returnToPayment, setReturnToPayment] = useState(false)

  useEffect(() => {
    if (toCity) {
      setDeliveryAddress(toCity)
      setRecipientAddress(toCity)
    }
    if (fromCity) {
      setSenderAddress(fromCity)
    }
  }, [toCity, fromCity])

  // Восстановление данных из location.state или URL при возврате с offers
  useEffect(() => {
    // Сначала проверяем URL
    const urlParams = new URLSearchParams(location.search)
    const encoded = urlParams.get('data')
    let wizardDataFromUrl = null
    
    if (encoded) {
      try {
        const decodedBase64 = decodeURIComponent(encoded)
        const binaryString = atob(decodedBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const decoded = new TextDecoder('utf-8').decode(bytes)
        wizardDataFromUrl = JSON.parse(decoded)
      } catch (err) {
        console.error('Ошибка декодирования данных из URL:', err)
      }
    }
    
    // Используем данные из state или URL
    const state = location.state
    const data = state?.wizardData || wizardDataFromUrl
    
    const offer = state?.selectedOffer || data?.selectedOffer || (state?.wizardData?.selectedOffer) || (wizardDataFromUrl?.selectedOffer)
    
    if (offer) {
      setSelectedOffer(offer)
      if (!location.state?.currentStep) {
        setCurrentStep('email')
      }
    }
    
    if (data) {
      // Восстанавливаем все данные формы только если нет selectedOffer
      if (data.fromCity) setFromCity(data.fromCity)
      if (data.toCity) setToCity(data.toCity)
      if (data.selectedRole) setSelectedRole(data.selectedRole)
      if (data.packageOption) setPackageOption(data.packageOption)
      if (data.length) setLength(data.length)
      if (data.width) setWidth(data.width)
      if (data.height) setHeight(data.height)
      if (data.weight) setWeight(data.weight)
      if (data.selectedSize) setSelectedSize(data.selectedSize)
      if (data.senderPhone) setSenderPhone(data.senderPhone)
      if (data.senderFIO) setSenderFIO(data.senderFIO)
      if (data.senderAddress) setSenderAddress(data.senderAddress)
      if (data.deliveryAddress) setDeliveryAddress(data.deliveryAddress)
      if (data.userPhone) setUserPhone(data.userPhone)
      if (data.contactPhone) setContactPhone(data.contactPhone)
      if (data.recipientPhone) setRecipientPhone(data.recipientPhone)
      if (data.recipientAddress) setRecipientAddress(data.recipientAddress)
      if (data.recipientFIO) setRecipientFIO(data.recipientFIO)
      if (data.email) setEmail(data.email)
      if (data.deliveryMethod) setDeliveryMethod(data.deliveryMethod)
      if (data.paymentPayer) setPaymentPayer(data.paymentPayer)
      if (data.pickupAddress) setPickupAddress(data.pickupAddress)
      if (data.pickupSenderName) setPickupSenderName(data.pickupSenderName)
      if (data.packageDataCompleted) setPackageDataCompleted(data.packageDataCompleted)
      if (data.returnToPayment) setReturnToPayment(data.returnToPayment)
    }
  }, [location.state, location.search])

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

  const handleBack = () => {
    if (currentStep === 'email') {
      if (selectedRole === 'recipient') {
        setCurrentStep('senderAddress')
      } else {
        setCurrentStep('recipientAddress')
      }
    } else if (currentStep === 'recipientAddress') {
      setCurrentStep('payment')
    } else if (currentStep === 'senderAddress') {
      if (selectedRole === 'recipient') {
        setCurrentStep('senderPhone')
      } else {
        setCurrentStep('payment')
      }
    } else if (currentStep === 'payment') {
      if (selectedRole === 'sender') {
        setCurrentStep('recipientPhone')
      } else {
        setCurrentStep('userPhone')
      }
    } else if (currentStep === 'recipientPhone') {
      setCurrentStep('deliveryMethod')
    } else if (currentStep === 'deliveryMethod') {
      setCurrentStep('senderFIO')
    } else if (currentStep === 'senderFIO') {
      if (selectedRole === 'sender') {
        if (codeSent) {
          setCodeSent(false)
          setSmsCode('')
          setCodeError('')
          setTelegramSent(false)
        } else {
          setCurrentStep('contactPhone')
        }
      } else {
        setCurrentStep('senderPhone')
      }
    } else if (currentStep === 'pickupAddress' && pickupAddress && pickupSenderName) {
      setSenderAddress(pickupAddress)
      setSenderFIO(pickupSenderName)
      if (selectedRole === 'sender') {
        setCurrentStep('recipientPhone')
      } else {
        setCurrentStep('package')
      }
    } else if (currentStep === 'contactPhone') {
      setCurrentStep('package')
    } else if (currentStep === 'userPhone' && codeSent) {
      setCodeSent(false)
      setSmsCode('')
      setCodeError('')
      setTelegramSent(false)
    } else if (currentStep === 'userPhone') {
      setCurrentStep('deliveryAddress')
    } else if (currentStep === 'deliveryAddress') {
      if (selectedRole === 'recipient') {
        setCurrentStep('package')
      } else {
        setCurrentStep('senderFIO')
      }
    } else if (currentStep === 'senderPhone') {
      if (selectedRole === 'recipient') {
        setCurrentStep('userPhone')
        setCodeSent(false)
        setSmsCode('')
        setCodeError('')
        setTelegramSent(false)
      } else {
        setCurrentStep('package')
        setPackageDataCompleted(false)
        setSenderPhone('')
      }
    } else if (packageDataCompleted && selectedRole === 'recipient') {
      setCurrentStep('deliveryAddress')
    } else if (selectedRole) {
      setSelectedRole(null)
      setPackageOption(null)
      setPackageDataCompleted(false)
      setCurrentStep('package')
    } else {
      navigate('/calculate')
    }
  }

  const handleContinue = () => {
    if (currentStep === 'package') {
      if (packageOption === 'photo' && photoPreview) {
        setPackageDataCompleted(true)
        if (selectedRole === 'recipient') {
          setCurrentStep('deliveryAddress')
        } else if (selectedRole === 'sender') {
          setCurrentStep('contactPhone')
        } else {
          setCurrentStep('contactPhone')
        }
      } else if (packageOption === 'manual' && length && width && height && weight) {
        setPackageDataCompleted(true)
        if (selectedRole === 'recipient') {
          setCurrentStep('deliveryAddress')
        } else if (selectedRole === 'sender') {
          setCurrentStep('contactPhone')
        } else {
          setCurrentStep('contactPhone')
        }
      } else if (packageOption === 'unknown' && selectedSize) {
        setPackageDataCompleted(true)
        if (selectedRole === 'recipient') {
          setCurrentStep('deliveryAddress')
        } else if (selectedRole === 'sender') {
          setCurrentStep('contactPhone')
        } else {
          setCurrentStep('contactPhone')
        }
      } else {
        console.log('Package data not complete:', { packageOption, photoPreview, length, width, height, weight, selectedSize, selectedRole })
        alert('Заполните все необходимые поля')
      }
    } else if (currentStep === 'contactPhone' && contactPhone && !codeSent) {
      setUserPhone(contactPhone)
    } else if (currentStep === 'senderPhone' && senderPhone) {
      if (selectedRole === 'recipient') {
        setCurrentStep('senderAddress')
      } else {
        setCurrentStep('senderFIO')
      }
    } else if (currentStep === 'senderFIO' && senderFIO) {
      setCurrentStep('deliveryMethod')
    } else if (currentStep === 'deliveryMethod' && deliveryMethod) {
      setCurrentStep('recipientPhone')
    } else if (currentStep === 'recipientPhone' && recipientPhone) {
      setCurrentStep('payment')
    } else if (currentStep === 'deliveryAddress' && deliveryAddress) {
      setCurrentStep('userPhone')
    } else if (currentStep === 'userPhone' && userPhone && !codeSent) {
      handleSendCode('sms')
    } else if (currentStep === 'payment' && paymentPayer) {
      const isRecipientPays = (selectedRole === 'sender' && paymentPayer === 'recipient') || (selectedRole === 'recipient' && paymentPayer === 'sender')
      if (isRecipientPays) {
        setCurrentStep('orderComplete')
      } else {
        if (selectedRole === 'sender') {
          setCurrentStep('recipientAddress')
        } else {
          setCurrentStep('recipientAddress')
        }
      }
    } else if (currentStep === 'pickupAddress' && pickupAddress && pickupSenderName) {
      setSenderAddress(pickupAddress)
      setSenderFIO(pickupSenderName)
      if (selectedRole === 'sender') {
        setCurrentStep('recipientPhone')
      } else {
        setCurrentStep('package')
      }
    } else if (currentStep === 'recipientAddress' && recipientAddress && recipientFIO) {
      if (returnToPayment && selectedOffer) {
        const wizardData = {
          fromCity,
          toCity,
          selectedRole,
          length,
          width,
          height,
          weight,
          selectedSize,
          packageOption,
          senderPhone,
          senderFIO,
          senderAddress: deliveryMethod === 'courier' ? senderAddress : fromCity,
          deliveryAddress,
          recipientPhone,
          recipientAddress,
          recipientFIO,
          userPhone: contactPhone || userPhone,
          email,
          deliveryMethod,
          paymentPayer,
          photoFile,
        }
        
        navigate('/payment', {
          state: {
            wizardData,
            company: selectedOffer.company_id,
            companyName: selectedOffer.company_name,
            companyCode: selectedOffer.company_code,
            price: selectedOffer.price,
            tariffCode: selectedOffer.tariff_code,
            tariffName: selectedOffer.tariff_name,
            deliveryTime: selectedOffer.delivery_time,
          }
        })
      } else {
        handleNavigateToOffers()
      }
    } else if (currentStep === 'senderAddress' && senderAddress && senderFIO) {
      if (selectedRole === 'recipient') {
        handleNavigateToOffers()
      } else {
        setCurrentStep('email')
      }
    } else if (currentStep === 'email' && email && agreePersonalData) {
      // Если выбрано предложение, переходим на страницу оплаты
      if (selectedOffer) {
        const wizardData = {
          fromCity,
          toCity,
          selectedRole,
          length,
          width,
          height,
          weight,
          selectedSize,
          packageOption,
          senderPhone,
          senderFIO,
          senderAddress: deliveryMethod === 'courier' ? senderAddress : fromCity,
          deliveryAddress,
          recipientPhone,
          recipientAddress,
          recipientFIO,
          userPhone: contactPhone || userPhone,
          email,
          deliveryMethod,
          paymentPayer,
          photoFile,
        }
        
        navigate('/payment', {
          state: {
            wizardData,
            company: selectedOffer.company_id,
            companyName: selectedOffer.company_name,
            companyCode: selectedOffer.company_code,
            price: selectedOffer.price,
            tariffCode: selectedOffer.tariff_code,
            tariffName: selectedOffer.tariff_name,
            deliveryTime: selectedOffer.delivery_time,
          }
        })
      } else {
        handleNavigateToOffers()
      }
    }
  }


  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setCurrentStep('package')
  }

  const handleSendCode = async (method = 'telegram') => {
    const phoneToUse = currentStep === 'contactPhone' ? contactPhone : userPhone
    if (!phoneToUse) {
      setCodeError('Введите номер телефона')
      return
    }
    setCodeLoading(true)
    setCodeError('')
    setTelegramSent(false)
    try {
      const response = await authAPI.sendCode(phoneToUse, method)
      if (response.data?.success || response.data?.telegram_sent) {
        if (response.data?.telegram_sent) {
          setTelegramSent(true)
        }
        setCodeSent(true)
        if (currentStep === 'contactPhone') {
          setUserPhone(contactPhone)
        }
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
    setCodeLoading(true)
    setCodeError('')
    try {
      const phoneToUse = currentStep === 'contactPhone' ? contactPhone : userPhone
      const response = await authAPI.verifyCode(phoneToUse, codeToVerify)
      
      if (currentStep === 'contactPhone') {
        setUserPhone(contactPhone)
        setCodeSent(false)
        setSmsCode('')
        setCodeError('')
        setTelegramSent(false)
        setCurrentStep('pickupAddress')
      } else {
        setCodeSent(false)
        setSmsCode('')
        setCodeError('')
        setTelegramSent(false)
        if (selectedRole === 'sender') {
          setCurrentStep('senderFIO')
        } else {
          setCurrentStep('senderPhone')
        }
      }
    } catch (err) {
      setCodeError(err.response?.data?.error || err.message || 'Неверный код')
    } finally {
      setCodeLoading(false)
    }
  }

  const handleResendCode = () => {
    setCodeSent(false)
    setSmsCode('')
    setCodeError('')
    setTelegramSent(false)
  }

  const handleCalculate = () => {
    if (!fromCity || !toCity) {
      return
    }

    if (packageDataCompleted) {
      let finalWeight = '1'
      let finalLength = ''
      let finalWidth = ''
      let finalHeight = ''

      if (packageOption === 'manual') {
        finalWeight = weight || '1'
        finalLength = length || ''
        finalWidth = width || ''
        finalHeight = height || ''
      } else if (packageOption === 'unknown' && selectedSize) {
        const sizeOption = sizeOptions.find(opt => opt.id === selectedSize)
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
      }

      const wizardData = {
        fromCity,
        toCity,
        selectedRole,
        length: finalLength,
        width: finalWidth,
        height: finalHeight,
        weight: finalWeight,
        selectedSize,
        packageOption,
        senderPhone,
        senderFIO,
        senderAddress: deliveryMethod === 'courier' ? senderAddress : fromCity,
        deliveryAddress,
        recipientPhone,
        recipientAddress,
        recipientFIO,
        userPhone: contactPhone || userPhone,
        email,
        deliveryMethod,
        paymentPayer,
        photoFile,
      }
      
      navigate('/offers', { state: { wizardData } })
    }
  }

  const handleNavigateToOffers = () => {
    let finalWeight = '1'
    let finalLength = ''
    let finalWidth = ''
    let finalHeight = ''

    if (packageOption === 'manual') {
      finalWeight = weight || '1'
      finalLength = length || ''
      finalWidth = width || ''
      finalHeight = height || ''
    } else if (packageOption === 'unknown' && selectedSize) {
      const sizeOption = sizeOptions.find(opt => opt.id === selectedSize)
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
    }

    const wizardData = {
      fromCity,
      toCity,
      selectedRole,
      length: finalLength,
      width: finalWidth,
      height: finalHeight,
      weight: finalWeight,
      selectedSize,
      packageOption,
      senderPhone,
      senderFIO,
      senderAddress: deliveryMethod === 'courier' ? senderAddress : fromCity,
      deliveryAddress,
      recipientPhone,
      recipientAddress,
      recipientFIO,
      userPhone: contactPhone || userPhone,
      email,
      deliveryMethod,
      paymentPayer,
      photoFile,
      returnToPayment: currentStep === 'recipientPhone' && selectedRole === 'sender',
    }
    
    // Сохраняем данные в URL для надежности
    try {
      const jsonString = JSON.stringify(wizardData)
      const encoded = btoa(unescape(encodeURIComponent(jsonString)))
      navigate(`/offers?data=${encodeURIComponent(encoded)}`, { state: { wizardData } })
    } catch (err) {
      console.error('Ошибка кодирования данных:', err)
      navigate('/offers', { state: { wizardData } })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-6 py-6 gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-8" />
        </Link>
        <div className="w-full max-w-[720px] bg-white rounded-2xl flex items-stretch p-2">
          <div className="flex-1 px-6 py-2 border-r border-[#E5E5E5]">
            <CityInput
              placeholder="Откуда"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              variant="hero"
              label="Откуда"
            />
          </div>
          <div className="flex-1 px-6 py-2 ">
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
            disabled={!fromCity || !toCity}
            className="bg-[#0077FE] text-white px-4 py-2 text-base font-semibold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Рассчитать стоимость
          </button>
        </div>
      </header>

      <div className="flex justify-center pt-12 pb-8">
        <div className="w-full max-w-[720px] bg-white rounded-2xl p-8 mx-6 ">
          <div className="mb-6">
            <div className="w-full h-1 bg-[#E5F0FF] rounded-full overflow-hidden">
              <div className="h-full bg-[#0077FE]" style={{ 
                width: currentStep === 'email' ? '100%' :
                       currentStep === 'recipientAddress' || currentStep === 'senderAddress' ? '98%' :
                       currentStep === 'payment' ? '95%' :
                       currentStep === 'recipientPhone' ? '90%' :
                       currentStep === 'deliveryMethod' ? '85%' :
                       currentStep === 'userPhone' ? (selectedRole === 'recipient' ? '70%' : '90%') : 
                       currentStep === 'deliveryAddress' ? (selectedRole === 'recipient' ? '60%' : '90%') :
                       currentStep === 'senderFIO' ? '80%' :
                       currentStep === 'contactPhone' && codeSent ? '75%' :
                       currentStep === 'contactPhone' ? '70%' :
                       currentStep === 'pickupAddress' ? '80%' :
                       currentStep === 'senderPhone' ? (selectedRole === 'recipient' ? '80%' : '70%') :
                       packageDataCompleted && selectedRole === 'recipient' ? '50%' : 
                       selectedRole ? '50%' : '35%' 
              }}></div>
            </div>
            <p className="text-sm text-[#858585] mt-2 text-center">
              {currentStep === 'email'
                ? 'Далее только транспортные компании...'
                : currentStep === 'payment' || currentStep === 'recipientAddress' || currentStep === 'senderAddress'
                  ? 'Уже подобрали транспортные компании...' 
                  : currentStep === 'userPhone' || currentStep === 'deliveryAddress' || currentStep === 'senderFIO' || currentStep === 'senderPhone' || currentStep === 'recipientPhone' || currentStep === 'deliveryMethod' || currentStep === 'contactPhone' || currentStep === 'pickupAddress' || currentStep === 'orderComplete'
                    ? 'Уже подбираем транспортные компании...' 
                    : packageDataCompleted && selectedRole === 'recipient' 
                      ? 'Уже подбираем транспортные компании...' 
                      : selectedRole 
                        ? 'Мы уже близко...' 
                        : 'Осталось еще чуть-чуть...'}
            </p>
          </div>

          {!selectedRole ? (
            <>
              <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                Кто оформляет отправку?
              </h1>
              <p className="text-base text-[#2D2D2D] mb-8 text-center">
                Выберите один из вариантов ниже 👉
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleRoleSelect('sender')}
                  className={`p-6 rounded-xl border transition-all ${
                    selectedRole === 'sender'
                      ? 'border-[#0077FE] bg-[#F0F7FF]'
                      : 'border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center text-6xl">
                      📦
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">Я отправитель</h3>
                      <p className="text-sm text-[#2D2D2D] leading-relaxed">Посылка у меня. Я передам её курьеру</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('recipient')}
                  className={`p-6 rounded-xl border transition-all ${
                    selectedRole === 'recipient'
                      ? 'border-[#0077FE] bg-[#F0F7FF]'
                      : 'border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center text-6xl relative">
                      <span>📲</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">Я получатель</h3>
                      <p className="text-sm text-[#2D2D2D] leading-relaxed">Посылка у отправителя. Я оформляю</p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          ) : (currentStep === 'package' || (!packageDataCompleted && selectedRole !== null)) ? (
            <>
              <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                Расскажите о посылке
              </h1>
              <p className="text-base text-[#2D2D2D] mb-8 text-center">
                Фото - лучший способ: мы сами определим размеры и подберём упаковку.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPackageOption('photo')}
                  className={`p-6 rounded-xl border transition-all ${
                    packageOption === 'photo'
                      ? 'border-[#0077FE] bg-[#F0F7FF]'
                      : 'border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center text-6xl">
                      📸
                    </div>
                    <p className="text-base font-semibold text-[#2D2D2D]">Сфотографировать посылку</p>
                  </div>
                </button>

                <button
                  onClick={() => setPackageOption('manual')}
                  className={`p-6 rounded-xl border transition-all ${
                    packageOption === 'manual'
                      ? 'border-[#0077FE] bg-[#F0F7FF]'
                      : 'border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center text-6xl">
                      ✏️
                    </div>
                    <p className="text-base font-semibold text-[#2D2D2D]">Указать габариты вручную</p>
                  </div>
                </button>
              </div>

              {!packageOption && (
                <div className="text-center mb-8">
                  <button
                    onClick={() => setPackageOption('unknown')}
                    className="text-sm text-[#0077FE] hover:underline"
                  >
                    Не знаю габариты
                  </button>
                </div>
              )}

              {packageOption === 'photo' && (
                <div className="mb-8">
                  <div className="border-2 border-dashed border-[#0077FE] rounded-xl p-8 mb-6">
                    {!photoPreview ? (
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-[#2D2D2D]">Фотография весом не более 5 мб.</p>
                        <input
                          type="file"
                          id="photo-upload"
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
                          htmlFor="photo-upload"
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
                              const input = document.getElementById('photo-upload')
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
                            id="photo-replace"
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
                            htmlFor="photo-replace"
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
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {packageOption === 'manual' && (
                <div className="mb-8">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <NumberInput
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      label="Длина, см"
                    />
                    <NumberInput
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      label="Ширина, см"
                    />
                    <NumberInput
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      label="Высота, см"
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
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {packageOption === 'unknown' && (
                <div className="mb-8">
                  <div className="grid grid-cols-4 gap-4 mb-6">
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
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

            </>
          ) : (
            <>
              {currentStep === 'senderPhone' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Укажите номер отправителя
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    мы свяжемся с отправителем, номер нужен для оформления и связи с курьером
                  </p>
                  <div className="mb-6">
                    <PhoneInput
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      label="Телефон отправителя"
                    />
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'contactPhone' && !codeSent && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Как с вами связаться?
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    Курьер позвонит перед приездом
                  </p>
                  <div className="mb-6">
                    <PhoneInput
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      label="Ваш телефон"
                    />
                  </div>
                  {codeError && (
                    <div className="mb-4">
                      <p className="text-sm text-red-500 text-center mb-2">{codeError}</p>
                    </div>
                  )}
                  <button 
                    onClick={() => handleSendCode('telegram')}
                    disabled={codeLoading || !contactPhone}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {codeLoading ? 'Отправка...' : 'Получить код в Telegram'}
                  </button>
                  <button 
                    onClick={handleSendSmsCode}
                    disabled={codeLoading || !contactPhone}
                    className="w-full bg-[#F5F5F5] text-[#2D2D2D] px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                  >
                    {codeLoading ? 'Отправка...' : 'Отправить SMS'}
                  </button>
                </div>
              )}

              {currentStep === 'contactPhone' && codeSent && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    {telegramSent ? 'Введите код из Telegram' : 'Введите код из СМС'}
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    {telegramSent ? (
                      <>Отправили в <strong>Telegram</strong></>
                    ) : (
                      <>Отправили на <strong>{contactPhone}</strong></>
                    )}
                  </p>
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
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false)
                        setSmsCode('')
                        setCodeError('')
                        setTelegramSent(false)
                      }}
                      className="text-sm text-[#0077FE] hover:underline"
                    >
                      Изменить номер
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={codeLoading}
                      className="text-sm text-[#858585] hover:text-[#2D2D2D] disabled:opacity-50"
                    >
                      Получить новый код
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'pickupAddress' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Где забрать посылку?
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    Осталось указать адрес, откуда забрать посылку, и имя отправителя — чтобы мы могли оформить забор.
                  </p>
                  
                  <div className="mb-6">
                    <AddressInput
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      onCityChange={(e) => {
                        if (fromCity) {
                          setFromCity(e.target.value)
                        }
                      }}
                      label="Адрес забора"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <div className="relative">
                      <div className={`relative border rounded-xl ${
                        pickupSenderNameFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
                      }`}>
                        <input
                          type="text"
                          value={pickupSenderName}
                          onChange={(e) => setPickupSenderName(e.target.value)}
                          onFocus={() => setPickupSenderNameFocused(true)}
                          onBlur={() => setPickupSenderNameFocused(false)}
                          placeholder=" "
                          className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
                        />
                        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                          pickupSenderName || pickupSenderNameFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
                        } ${pickupSenderNameFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
                          Имя отправителя *
                        </label>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleContinue}
                    disabled={!pickupAddress || !pickupSenderName}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'senderFIO' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Укажите недостающие данные о Вас
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    ФИО необходимо для того, чтобы отправить посылку
                  </p>
                  <div className="mb-6">
                    <div className="relative">
                      <div className={`relative border rounded-xl ${
                        fioFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
                      }`}>
                        <input
                          type="text"
                          value={senderFIO}
                          onChange={(e) => setSenderFIO(e.target.value)}
                          onFocus={() => setFioFocused(true)}
                          onBlur={() => setFioFocused(false)}
                          placeholder=" "
                          className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
                        />
                        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                          senderFIO || fioFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
                        } ${fioFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
                          ФИО
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'deliveryMethod' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Как вы хотите передать посылку?
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    Выберите один из способов👇
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => {
                        setDeliveryMethod('courier')
                        if (fromCity) {
                          setSenderAddress(fromCity)
                        }
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        deliveryMethod === 'courier'
                          ? 'border-[#0077FE] bg-white'
                          : 'border-[#E5E5E5] bg-[#F5F5F5]'
                      }`}
                    >
                      <span className="flex flex-col items-center gap-4">
                        <span className="w-16 h-16 flex items-center justify-center text-6xl">
                          👋
                        </span>
                        <span className="text-base font-semibold text-[#2D2D2D]">Курьер заберёт посылку</span>
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setDeliveryMethod('pickup')
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'border-[#0077FE] bg-white'
                          : 'border-[#E5E5E5] bg-[#F5F5F5]'
                      }`}
                    >
                      <span className="flex flex-col items-center gap-4">
                        <span className="w-16 h-16 flex items-center justify-center text-6xl">
                          🏫
                        </span>
                        <span className="text-base font-semibold text-[#2D2D2D]">Сдам в пункте приёма</span>
                      </span>
                    </button>
                  </div>
                  {deliveryMethod === 'courier' && (
                    <div className="mb-6">
                      <AddressInput
                        value={senderAddress || fromCity}
                        onChange={(e) => {
                          setSenderAddress(e.target.value)
                          setFromCity(e.target.value)
                        }}
                        label="Адрес"
                      />
                    </div>
                  )}
                  {deliveryMethod === 'pickup' && (
                    <div className="mb-6 p-4 bg-[#F5F5F5] rounded-xl flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#0077FE] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <p className="text-sm text-[#2D2D2D]">
                        Мы покажем ближайшие пункты приёма без очереди после подтверждения отправки. Нажмите "Продолжить".
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={handleContinue}
                    disabled={!deliveryMethod || (deliveryMethod === 'courier' && !senderAddress)}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'recipientPhone' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Телефон получателя
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    Получателю придёт ссылка на оплату или отслеживание
                  </p>
                  <div className="mb-6">
                    <PhoneInput
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      label="Телефон получателя"
                    />
                  </div>
                  <button 
                    onClick={handleContinue}
                    disabled={!recipientPhone}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold disabled:opacity-50"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'deliveryAddress' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Куда доставить посылку?
                  </h1>
                  <div className="mb-6">
                    <AddressInput
                      value={deliveryAddress || toCity}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      label="Адрес"
                    />
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'userPhone' && !codeSent && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Ваш телефон
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    Это необходимо для оформления заказа, так же вы сможете отслеживать статус используя номер
                  </p>
                  <div className="mb-6">
                    <PhoneInput
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      label="Ваш телефон"
                    />
                  </div>
                  {codeError && (
                    <div className="mb-4">
                      <p className="text-sm text-red-500 text-center mb-2">{codeError}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleSendCode('telegram')}
                      disabled={codeLoading || !userPhone}
                      className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold disabled:opacity-50"
                    >
                      {codeLoading ? 'Отправка...' : 'Получить код в Telegram'}
                    </button>
                    <button
                      onClick={() => handleSendCode('sms')}
                      disabled={codeLoading || !userPhone}
                      className="w-full bg-white border border-[#0077FE] text-[#0077FE] px-6 py-4 rounded-xl text-base font-semibold disabled:opacity-50"
                    >
                      {codeLoading ? 'Отправка...' : 'Отправить SMS'}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'userPhone' && codeSent && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    {telegramSent ? 'Введите код из Telegram' : 'Введите код из СМС'}
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    {telegramSent ? (
                      <>Отправили в <strong>Telegram</strong></>
                    ) : (
                      <>Отправили на <strong>{userPhone}</strong></>
                    )}
                  </p>
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
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false)
                        setSmsCode('')
                        setCodeError('')
                        setTelegramSent(false)
                      }}
                      className="text-sm text-[#0077FE] hover:underline"
                    >
                      Изменить номер
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={codeLoading}
                      className="text-sm text-[#858585] hover:text-[#2D2D2D] disabled:opacity-50"
                    >
                      Получить новый код
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'payment' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Кто оплатит доставку?
                  </h1>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => setPaymentPayer(selectedRole === 'sender' ? 'me' : 'me')}
                      className={`p-6 rounded-xl border transition-all ${
                        paymentPayer === 'me'
                          ? 'border-[#0077FE] bg-[#F0F7FF]'
                          : 'border-[#E5E5E5] bg-white hover:border-[#0077FE]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 flex items-center justify-center text-6xl">
                          💸
                        </div>
                        <p className="text-base font-semibold text-[#2D2D2D]">Я оплачу</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentPayer(selectedRole === 'sender' ? 'recipient' : 'sender')}
                      className={`p-6 rounded-xl border transition-all ${
                        (selectedRole === 'sender' && paymentPayer === 'recipient') || (selectedRole === 'recipient' && paymentPayer === 'sender')
                          ? 'border-[#0077FE] bg-[#F0F7FF]'
                          : 'border-[#E5E5E5] bg-white hover:border-[#0077FE]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 flex items-center justify-center text-6xl">
                        🙎‍♂️
                        </div>
                        <p className="text-base font-semibold text-[#2D2D2D]">
                          {selectedRole === 'sender' ? 'Получатель оплатит по ссылке' : 'Отправитель оплатит'}
                        </p>
                      </div>
                    </button>
                  </div>
                  <button 
                    onClick={handleContinue}
                    disabled={!paymentPayer}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'recipientAddress' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Пожалуйста, укажите адрес получателя и ФИО
                  </h1>
                  <div className="mb-6">
                    <AddressInput
                      value={recipientAddress || toCity}
                      onChange={(e) => {
                        setRecipientAddress(e.target.value)
                        setToCity(e.target.value)
                      }}
                      label="Адрес"
                    />
                  </div>
                  <div className="mb-6">
                    <div className="relative">
                      <div className={`relative border rounded-xl ${
                        recipientFioFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
                      }`}>
                        <input
                          type="text"
                          value={recipientFIO}
                          onChange={(e) => setRecipientFIO(e.target.value)}
                          onFocus={() => setRecipientFioFocused(true)}
                          onBlur={() => setRecipientFioFocused(false)}
                          placeholder=" "
                          className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
                        />
                        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                          recipientFIO || recipientFioFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
                        } ${recipientFioFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
                          ФИО
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'orderComplete' && (
                <div className="mb-8">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">👍</div>
                    <h1 className="text-3xl font-bold text-[#2D2D2D] mb-4">
                      Готово 👍 Отправление создано
                    </h1>
                    <p className="text-base text-[#2D2D2D] mb-8">
                      Получатель выберет и оплатит доставку. Мы сообщим Вам, когда назначим курьера.
                    </p>
                    <button
                      onClick={() => navigate('/cabinet')}
                      className="bg-[#0077FE] text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors"
                    >
                      Понятно
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'senderAddress' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Пожалуйста, укажите адрес отправителя и ФИО
                  </h1>
                  <div className="mb-6">
                    <AddressInput
                      value={senderAddress || fromCity}
                      onChange={(e) => {
                        setSenderAddress(e.target.value)
                        setFromCity(e.target.value)
                      }}
                      label="Адрес"
                    />
                  </div>
                  <div className="mb-6">
                    <div className="relative">
                      <div className={`relative border rounded-xl ${
                        fioFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
                      }`}>
                        <input
                          type="text"
                          value={senderFIO}
                          onChange={(e) => setSenderFIO(e.target.value)}
                          onFocus={() => setFioFocused(true)}
                          onBlur={() => setFioFocused(false)}
                          placeholder=" "
                          className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
                        />
                        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                          senderFIO || fioFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
                        } ${fioFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
                          ФИО
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleContinue}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold"
                  >
                    Продолжить
                  </button>
                </div>
              )}

              {currentStep === 'email' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                    Укажите ваш электронный адрес
                  </h1>
                  <p className="text-base text-[#2D2D2D] mb-8 text-center">
                    По нему вы сможете авторизоваться, чтобы отслеживать статус доставки
                  </p>
                  <div className="mb-6">
                    <div className="relative">
                      <div className={`relative border rounded-xl ${
                        emailFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
                      }`}>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          placeholder=" "
                          className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
                        />
                        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                          email || emailFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
                        } ${emailFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
                          Электронный адрес
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreePersonalData}
                        onChange={(e) => setAgreePersonalData(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-[#C8C7CC] text-[#0077FE] focus:ring-[#0077FE]"
                      />
                      <span className="text-sm text-[#2D2D2D]">
                        Я согласен с <a href="#" className="text-[#0077FE] hover:underline">Условиями обработки моих персональных данных</a>, а также даю <a href="#" className="text-[#0077FE] hover:underline">Согласие на обработку моих ПД</a>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeMarketing}
                        onChange={(e) => setAgreeMarketing(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-[#C8C7CC] text-[#0077FE] focus:ring-[#0077FE]"
                      />
                      <span className="text-sm text-[#2D2D2D]">
                        Даю <a href="#" className="text-[#0077FE] hover:underline">Согласие для направления информационных сообщений</a>. Отписаться от рассылки можно в любое время.
                      </span>
                    </label>
                  </div>
                  <button 
                    onClick={handleContinue}
                    disabled={!email || !agreePersonalData || loadingOffers}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingOffers ? 'Загрузка...' : 'Продолжить'}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="text-center">
            <button
              onClick={handleBack}
              className="text-sm text-[#858585] hover:text-[#2D2D2D] transition-colors"
            >
              ← Вернуться назад
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WizardPage
