import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Функция для логирования данных визарда
const logWizardStep = (step, data) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    step,
    data: JSON.parse(JSON.stringify(data)) // Глубокое копирование
  }
  
  // Сохраняем в localStorage
  const existingLogs = JSON.parse(localStorage.getItem('wizard_logs') || '[]')
  existingLogs.push(logEntry)
  localStorage.setItem('wizard_logs', JSON.stringify(existingLogs))
  
  // Выводим в консоль
  console.log(`📝 [WIZARD LOG] Step: ${step}`, logEntry)
  
  // Ограничиваем размер (храним последние 100 записей)
  if (existingLogs.length > 100) {
    existingLogs.shift()
    localStorage.setItem('wizard_logs', JSON.stringify(existingLogs))
  }
}

// Функция для экспорта логов в JSON файл
const exportWizardLogs = () => {
  const logs = JSON.parse(localStorage.getItem('wizard_logs') || '[]')
  const dataStr = JSON.stringify(logs, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wizard_logs_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  console.log('✅ Логи экспортированы в файл')
}

// Добавляем функцию в window для доступа из консоли
if (typeof window !== 'undefined') {
  window.exportWizardLogs = exportWizardLogs
  window.clearWizardLogs = () => {
    localStorage.removeItem('wizard_logs')
    console.log('🗑️ Логи очищены')
  }
}
import WizardLayout from '../components/wizard/WizardLayout'
import RoleSelectStep from './wizard/steps/RoleSelectStep'
import PackageStep from './wizard/steps/PackageStep'
import ContactPhoneStep from './wizard/steps/ContactPhoneStep'
import PickupAddressStep from './wizard/steps/PickupAddressStep'
import RecipientPhoneStep from './wizard/steps/RecipientPhoneStep'
import PaymentStep from './wizard/steps/PaymentStep'
import RecipientAddressStep from './wizard/steps/RecipientAddressStep'
import RecipientFIOStep from './wizard/steps/RecipientFIOStep'
import DeliveryAddressStep from './wizard/steps/DeliveryAddressStep'
import SenderPhoneStep from './wizard/steps/SenderPhoneStep'
import SenderAddressStep from './wizard/steps/SenderAddressStep'
import SelectPvzStep from './wizard/steps/SelectPvzStep'
import OrderCompleteStep from './wizard/steps/OrderCompleteStep'
import EmailStep from './wizard/steps/EmailStep'
import { authAPI, ordersAPI, tariffsAPI } from '../api'

function WizardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const urlParams = new URLSearchParams(location.search)
  const stepFromUrl = urlParams.get('step')
  
  const validSteps = ['role', 'package', 'contactPhone', 'pickupAddress', 'recipientPhone', 'payment', 'recipientAddress', 'recipientFIO', 'deliveryAddress', 'recipientUserPhone', 'senderPhone', 'senderAddress', 'selectPvz', 'email', 'orderComplete']
  const initialStep = stepFromUrl && validSteps.includes(stepFromUrl) ? stepFromUrl : 'role'
  
  const [fromCity, setFromCity] = useState(location.state?.fromCity || location.state?.wizardData?.fromCity || '')
  const [toCity, setToCity] = useState(location.state?.toCity || location.state?.wizardData?.toCity || '')
  const [selectedRole, setSelectedRole] = useState(location.state?.wizardData?.selectedRole || null)
  const [currentStep, setCurrentStep] = useState(initialStep)

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const stepFromUrl = urlParams.get('step')
    if (stepFromUrl && validSteps.includes(stepFromUrl) && stepFromUrl !== currentStep) {
      setCurrentStep(stepFromUrl)
    } else if (!stepFromUrl && currentStep !== 'role') {
      navigate(`/wizard?step=${currentStep}`, { replace: true })
    }
  }, [location.search, currentStep])
  
  useEffect(() => {
    const wizardData = location.state?.wizardData
    const stepFromUrl = new URLSearchParams(location.search).get('step') || 'role'
    
    // Логируем загрузку шага
    logWizardStep(`load_${stepFromUrl}`, {
      locationState: location.state,
      wizardData: wizardData,
      urlParams: location.search
    })
    
    if (location.state?.fromCity) {
      setFromCity(location.state.fromCity)
    }
    if (location.state?.toCity) {
      setToCity(location.state.toCity)
    }
    if (wizardData) {
      if (wizardData.fromCity) setFromCity(wizardData.fromCity)
      if (wizardData.toCity) setToCity(wizardData.toCity)
      if (wizardData.pickupAddress) setPickupAddress(wizardData.pickupAddress)
      if (wizardData.pickupSenderName) setPickupSenderName(wizardData.pickupSenderName)
      if (wizardData.recipientPhone) setRecipientPhone(wizardData.recipientPhone)
      if (wizardData.contactPhone) setContactPhone(wizardData.contactPhone)
      if (wizardData.recipientAddress) setRecipientAddress(wizardData.recipientAddress)
      if (wizardData.recipientFIO) setRecipientFIO(wizardData.recipientFIO)
      if (wizardData.deliveryAddress) setDeliveryAddress(wizardData.deliveryAddress)
      if (wizardData.recipientUserPhone) setRecipientUserPhone(wizardData.recipientUserPhone)
      if (wizardData.senderPhone) setSenderPhone(wizardData.senderPhone)
      if (wizardData.senderAddress) setSenderAddress(wizardData.senderAddress)
      if (wizardData.senderFIO) setSenderFIO(wizardData.senderFIO)
      if (wizardData.recipientDeliveryPointCode) setRecipientDeliveryPointCode(wizardData.recipientDeliveryPointCode)
      if (wizardData.recipientDeliveryPointAddress) setRecipientDeliveryPointAddress(wizardData.recipientDeliveryPointAddress)
      if (wizardData.weight) setWeight(wizardData.weight)
      if (wizardData.length) setLength(wizardData.length)
      if (wizardData.width) setWidth(wizardData.width)
      if (wizardData.height) setHeight(wizardData.height)
      if (wizardData.selectedRole) setSelectedRole(wizardData.selectedRole)
      if (wizardData.photoUrl) setPhotoUrl(wizardData.photoUrl)
      if (wizardData.estimatedValue) setEstimatedValue(wizardData.estimatedValue)
    }
    if (location.state?.selectedOffer || wizardData?.selectedOffer) {
      setSelectedOffer(location.state?.selectedOffer || wizardData?.selectedOffer)
    }
  }, [location.state])
  
  // Package data
  const [packageOption, setPackageOption] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false)
  const [photoAnalysis, setPhotoAnalysis] = useState(null)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [estimatedValue, setEstimatedValue] = useState(location.state?.wizardData?.estimatedValue || '')
  const [selectedSize, setSelectedSize] = useState(null)
  
  // Contact phone data
  const [contactPhone, setContactPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [telegramSent, setTelegramSent] = useState(false)
  
  // Pickup address data
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupSenderName, setPickupSenderName] = useState('')
  const [pickupSenderNameFocused, setPickupSenderNameFocused] = useState(false)
  
  // Recipient phone data
  const [recipientPhone, setRecipientPhone] = useState('')
  
  // Recipient user phone data (for recipient flow)
  const [recipientUserPhone, setRecipientUserPhone] = useState('')
  const [recipientUserSmsCode, setRecipientUserSmsCode] = useState('')
  const [recipientUserCodeSent, setRecipientUserCodeSent] = useState(false)
  const [recipientUserCodeLoading, setRecipientUserCodeLoading] = useState(false)
  const [recipientUserCodeError, setRecipientUserCodeError] = useState('')
  const [recipientUserTelegramSent, setRecipientUserTelegramSent] = useState(false)
  
  // Sender phone data (for recipient flow)
  const [senderPhone, setSenderPhone] = useState('')
  
  // Sender address data (for recipient flow)
  const [senderAddress, setSenderAddress] = useState('')
  const [senderFIO, setSenderFIO] = useState('')
  const [senderFioFocused, setSenderFioFocused] = useState(false)
  
  // Recipient address data
  const [recipientAddress, setRecipientAddress] = useState('')
  const [recipientFIO, setRecipientFIO] = useState('')
  const [recipientFioFocused, setRecipientFioFocused] = useState(false)
  
  // Delivery address data (for recipient flow)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryAddressError, setDeliveryAddressError] = useState('')
  
  // Delivery point data
  const [recipientDeliveryPointCode, setRecipientDeliveryPointCode] = useState(null)
  const [recipientDeliveryPointAddress, setRecipientDeliveryPointAddress] = useState('')
  
  // Payment data
  const [paymentPayer, setPaymentPayer] = useState(null)
  
  // Email data
  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [agreePersonalData, setAgreePersonalData] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  
  const [selectedOffer, setSelectedOffer] = useState(null)

  const handleCalculate = () => {
    if (!fromCity || !toCity) return
    const existingWizardData = location.state?.wizardData || {}
    navigate('/offers', { 
      state: { 
        wizardData: { 
          fromCity, 
          toCity,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery: existingWizardData.filterCourierDelivery
        } 
      } 
    })
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    navigate('/wizard?step=package', { state: { wizardData: { selectedRole: role } } })
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Файл слишком большой. Максимальный размер 5 МБ.')
        setPhotoPreview(null)
        setPhotoFile(null)
        setPhotoUrl(null)
        setPhotoAnalysis(null)
      } else {
        setPhotoError('')
        setPhotoFile(file)
        setPhotoAnalyzing(true)
        setPhotoAnalysis(null)
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotoPreview(reader.result)
        }
        reader.readAsDataURL(file)
        
        try {
          const formData = new FormData()
          formData.append('image', file)
          const uploadResponse = await ordersAPI.uploadPackageImage(formData)
          if (uploadResponse.data?.success && uploadResponse.data?.image_url) {
            setPhotoUrl(uploadResponse.data.image_url)
          }
          
          const analyzeFormData = new FormData()
          analyzeFormData.append('image', file)
          const analyzeResponse = await tariffsAPI.analyzeImage(analyzeFormData)
          if (analyzeResponse.data) {
            setPhotoAnalysis(analyzeResponse.data)
            if (analyzeResponse.data.length) setLength(analyzeResponse.data.length.toString())
            if (analyzeResponse.data.width) setWidth(analyzeResponse.data.width.toString())
            if (analyzeResponse.data.height) setHeight(analyzeResponse.data.height.toString())
            if (analyzeResponse.data.weight) setWeight(analyzeResponse.data.weight.toString())
            if (analyzeResponse.data.declared_value) {
              const declaredValue = analyzeResponse.data.declared_value.toString()
              setEstimatedValue(declaredValue)
              // Сохраняем в wizardData
              const currentWizardData = location.state?.wizardData || {}
              setWizardData({
                ...currentWizardData,
                estimatedValue: declaredValue
              })
            }
          }
        } catch (err) {
          console.error('Ошибка обработки изображения:', err)
          setPhotoError(err.response?.data?.error || 'Ошибка обработки изображения')
        } finally {
          setPhotoAnalyzing(false)
        }
      }
    }
  }

  const handlePhotoRemove = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    setPhotoUrl(null)
    setPhotoAnalysis(null)
    setPhotoAnalyzing(false)
    setPhotoError('')
    const input = document.getElementById('photo-upload')
    if (input) input.value = ''
    const inputReplace = document.getElementById('photo-replace')
    if (inputReplace) inputReplace.value = ''
  }

  const handlePackageContinue = () => {
    const currentWizardData = {
      ...location.state?.wizardData,
      selectedRole,
      weight,
      length,
      width,
      height,
      estimatedValue,
      selectedSize,
      packageOption,
      photoUrl
    }
    logWizardStep('package', currentWizardData)
    
    if (selectedRole === 'sender') {
      navigate('/wizard?step=contactPhone', { state: { wizardData: currentWizardData } })
    } else if (selectedRole === 'recipient') {
      navigate('/wizard?step=recipientFIO', { state: { wizardData: currentWizardData } })
    }
  }

  const handleRecipientFIOContinue = () => {
    const currentWizardData = {
      ...location.state?.wizardData,
      recipientFIO
    }
    logWizardStep('recipientFIO', currentWizardData)
    
    if (selectedRole === 'recipient') {
      navigate('/wizard?step=deliveryAddress', { state: { wizardData: currentWizardData } })
    }
  }

  const handleDeliveryAddressContinue = () => {
    const trimmedAddress = deliveryAddress.trim()
    
    if (!trimmedAddress) {
      setDeliveryAddressError('Укажите адрес доставки')
      return
    }
    
    const hasHouseNumber = /\d/.test(trimmedAddress)
    if (!hasHouseNumber) {
      setDeliveryAddressError('Укажите номер дома в адресе')
      return
    }
    
    setDeliveryAddressError('')
    const currentWizardData = {
      ...location.state?.wizardData,
      deliveryAddress: trimmedAddress
    }
    logWizardStep('deliveryAddress', currentWizardData)
    
    if (selectedRole === 'recipient') {
      navigate('/wizard?step=recipientUserPhone', { state: { wizardData: currentWizardData } })
    }
  }

  const handleRecipientUserSendCode = async (method = 'telegram') => {
    if (!recipientUserPhone) {
      setRecipientUserCodeError('Введите номер телефона')
      return
    }

    setRecipientUserCodeLoading(true)
    setRecipientUserCodeError('')

    const TEST_PHONES = ['+79999999999', '+79991111111', '+79990000000']
    const TEST_CODE = '1234'

    const cleanPhone = recipientUserPhone.replace(/\D/g, '')
    const isTestPhone = TEST_PHONES.some(testPhone => cleanPhone.includes(testPhone.replace(/\D/g, '')))
    
    if (isTestPhone) {
      setTimeout(() => {
        setRecipientUserCodeSent(true)
        if (method === 'telegram') {
          setRecipientUserTelegramSent(true)
        }
        setRecipientUserCodeLoading(false)
        console.log('🔧 Тестовый режим: код отправлен для номера', recipientUserPhone)
        console.log('🔧 Тестовый код:', TEST_CODE)
      }, 500)
      return
    }
    
    try {
      const response = await authAPI.sendCode(recipientUserPhone, method)
      if (response.data?.success || response.data?.telegram_sent) {
        if (response.data?.telegram_sent) {
          setRecipientUserTelegramSent(true)
        }
        setRecipientUserCodeSent(true)
    } else {
        setRecipientUserCodeError(response.data?.error || 'Ошибка отправки кода')
      }
        } catch (err) {
      const errorData = err.response?.data
      setRecipientUserCodeError(errorData?.error || err.message || 'Ошибка отправки кода')
    } finally {
      setRecipientUserCodeLoading(false)
    }
  }

  const handleRecipientUserVerifyCode = async (code = null) => {
    const codeToVerify = code || recipientUserSmsCode
    if (!codeToVerify || codeToVerify.length !== 4) {
      setRecipientUserCodeError('Введите код')
      return
    }
    
    setRecipientUserCodeLoading(true)
    setRecipientUserCodeError('')

    const TEST_PHONES = ['+79999999999', '+79991111111', '+79990000000']
    const TEST_CODE = '1234'
    
    const cleanPhone = recipientUserPhone.replace(/\D/g, '')
    const isTestPhone = TEST_PHONES.some(testPhone => cleanPhone.includes(testPhone.replace(/\D/g, '')))
    
    if (isTestPhone && codeToVerify === TEST_CODE) {
      setTimeout(() => {
        setRecipientUserCodeSent(false)
        setRecipientUserSmsCode('')
        setRecipientUserCodeError('')
        setRecipientUserTelegramSent(false)
        setRecipientUserCodeLoading(false)
        console.log('🔧 Тестовый режим: код верифицирован успешно')
        if (selectedRole === 'recipient') {
          navigate('/wizard?step=senderPhone')
        }
      }, 500)
      return
    }
    
    if (isTestPhone && codeToVerify !== TEST_CODE) {
      setRecipientUserCodeError('Неверный код. Тестовый код: ' + TEST_CODE)
      setRecipientUserCodeLoading(false)
      return
    }

    try {
      await authAPI.verifyCode(recipientUserPhone, codeToVerify)
      setRecipientUserCodeSent(false)
      setRecipientUserSmsCode('')
      setRecipientUserCodeError('')
      setRecipientUserTelegramSent(false)
      if (selectedRole === 'recipient') {
        navigate('/wizard?step=senderPhone')
      }
        } catch (err) {
      setRecipientUserCodeError(err.response?.data?.error || err.message || 'Неверный код')
    } finally {
      setRecipientUserCodeLoading(false)
    }
  }

  const handleRecipientUserResendCode = async () => {
    if (recipientUserPhone) {
      await handleRecipientUserSendCode('sms')
    }
  }

  const handleSenderPhoneContinue = () => {
      if (selectedRole === 'recipient') {
      navigate('/wizard?step=senderAddress')
    }
  }

  const handleSenderAddressContinue = () => {
    if (!fromCity || !toCity) {
      console.error('Города не заполнены:', { fromCity, toCity })
      alert('Пожалуйста, укажите города отправления и назначения')
      return
    }

    const trimmedAddress = senderAddress?.trim() || ''
    if (!trimmedAddress) {
      return
    }
    
    const hasHouseNumber = /\d/.test(trimmedAddress)
    if (!hasHouseNumber) {
      return
    }
    
    if (!senderFIO) {
      return
    }

      if (selectedRole === 'recipient') {
        const existingWizardData = location.state?.wizardData || {}
        const savedPickup = localStorage.getItem('filterCourierPickup')
        const savedDelivery = localStorage.getItem('filterCourierDelivery')
        const wizardData = {
        fromCity: fromCity.trim(),
        toCity: toCity.trim(),
        senderAddress: senderAddress,
        deliveryAddress: deliveryAddress,
        recipientAddress: deliveryAddress,
        weight: weight || '1',
        length: length || '0',
        width: width || '0',
        height: height || '0',
          packageOption,
        selectedSize,
        estimatedValue,
        recipientPhone: recipientUserPhone,
        recipientUserPhone: recipientUserPhone,
        contactPhone: recipientUserPhone,
        senderPhone: senderPhone,
          recipientFIO,
        senderFIO,
        pickupSenderName: senderFIO,
        paymentPayer: 'me',
        selectedRole: 'recipient',
        photoUrl,
        filterCourierPickup: existingWizardData.filterCourierPickup !== undefined 
          ? existingWizardData.filterCourierPickup 
          : (savedPickup !== null ? savedPickup === 'true' : true),
        filterCourierDelivery: existingWizardData.filterCourierDelivery !== undefined 
          ? existingWizardData.filterCourierDelivery 
          : (savedDelivery !== null ? savedDelivery === 'true' : false)
      }
      
      navigate('/offers', {
        state: { wizardData }
      })
    }
  }

  // Тестовые номера для разработки (не требуют реальной отправки SMS)
  const TEST_PHONES = ['+79999999999', '+79991111111', '+79990000000']
  const TEST_CODE = '1234'

  const handleSendCode = async (method = 'telegram') => {
    if (!contactPhone) {
      setCodeError('Введите номер телефона')
      return
    }
    
    // Проверка на тестовый номер
    const cleanPhone = contactPhone.replace(/\D/g, '')
    const isTestPhone = TEST_PHONES.some(testPhone => cleanPhone.includes(testPhone.replace(/\D/g, '')))
    
    if (isTestPhone) {
      // Фейковая отправка кода для тестового номера
      setCodeLoading(true)
      setTimeout(() => {
        setCodeSent(true)
        if (method === 'telegram') {
          setTelegramSent(true)
        }
        setCodeLoading(false)
        console.log('🔧 Тестовый режим: код отправлен для номера', contactPhone)
        console.log('🔧 Тестовый код:', TEST_CODE)
      }, 500)
      return
    }

    // Реальная отправка кода
    setCodeLoading(true)
    setCodeError('')
    setTelegramSent(false)
    try {
      const response = await authAPI.sendCode(contactPhone, method)
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

  const handleVerifyCode = async (code = null) => {
    const codeToVerify = code || smsCode
    if (!codeToVerify || codeToVerify.length !== 4) {
      setCodeError('Введите код')
      return
    }
    
    const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
    
    // Проверка на тестовый номер и код
    const cleanPhone = contactPhone.replace(/\D/g, '')
    const isTestPhone = TEST_PHONES.some(testPhone => cleanPhone.includes(testPhone.replace(/\D/g, '')))
    
    if (isTestPhone && codeToVerify === TEST_CODE) {
      setCodeLoading(true)
      setTimeout(() => {
        const testAccessToken = 'test_access_token_' + Date.now()
        const testRefreshToken = 'test_refresh_token_' + Date.now()
        localStorage.setItem('access_token', testAccessToken)
        localStorage.setItem('refresh_token', testRefreshToken)
        console.log('🔧 Тестовый режим: код верифицирован успешно, токены сохранены')
        window.dispatchEvent(new CustomEvent('authChange'))
        setCodeSent(false)
        setSmsCode('')
        setCodeError('')
        setTelegramSent(false)
        setCodeLoading(false)
        if (selectedRole === 'sender') {
          if (inviteRecipient) {
            const wizardDataForOrder = {
              fromCity,
              toCity,
              pickupAddress,
              pickupSenderName,
              recipientPhone,
              contactPhone,
              weight: weight || '1',
              length: length || '0',
              width: width || '0',
              height: height || '0',
              packageOption,
              selectedSize,
              estimatedValue,
              selectedRole: 'sender',
              inviteRecipient: true,
              photoUrl
            }
            navigate('/wizard?step=orderComplete', { 
              state: { 
                wizardData: wizardDataForOrder,
                inviteRecipient: true,
                selectedRole: 'sender'
              } 
            })
      } else {
            navigate('/wizard?step=pickupAddress')
          }
        }
      }, 500)
      return
    }
    
    if (isTestPhone && codeToVerify !== TEST_CODE) {
      setCodeError('Неверный код. Тестовый код: ' + TEST_CODE)
      return
    }

    // Реальная верификация кода
    setCodeLoading(true)
    setCodeError('')
    try {
      console.log('🔐 Начало верификации кода для телефона:', contactPhone)
      const response = await authAPI.verifyCode(contactPhone, codeToVerify)
      console.log('🔐 Ответ от API верификации:', response.data)
      if (response.data && response.data.tokens) {
        console.log('✅ Токены получены:', {
          access: response.data.tokens.access ? 'есть' : 'нет',
          refresh: response.data.tokens.refresh ? 'есть' : 'нет'
        })
        localStorage.setItem('access_token', response.data.tokens.access)
        localStorage.setItem('refresh_token', response.data.tokens.refresh)
        const savedToken = localStorage.getItem('access_token')
        console.log('💾 Токен сохранен в localStorage:', savedToken ? 'ДА (длина: ' + savedToken.length + ')' : 'НЕТ')
        window.dispatchEvent(new CustomEvent('authChange'))
      } else {
        console.log('⚠️ Токены не получены в ответе')
      }
        setCodeSent(false)
        setSmsCode('')
        setCodeError('')
        setTelegramSent(false)
        if (selectedRole === 'sender') {
        if (inviteRecipient) {
          const wizardDataForOrder = {
            fromCity,
            toCity,
            pickupAddress,
            pickupSenderName,
            recipientPhone,
            contactPhone,
            weight: weight || '1',
            length: length || '0',
            width: width || '0',
            height: height || '0',
            packageOption,
            selectedSize,
            estimatedValue,
            selectedRole: 'sender',
            inviteRecipient: true
          }
          navigate('/wizard?step=orderComplete', { 
            state: { 
              wizardData: wizardDataForOrder,
              inviteRecipient: true,
              selectedRole: 'sender'
            } 
          })
        } else {
          navigate('/wizard?step=pickupAddress')
        }
      }
    } catch (err) {
      setCodeError(err.response?.data?.error || err.message || 'Неверный код')
    } finally {
      setCodeLoading(false)
    }
  }

  const handlePickupAddressContinue = () => {
    const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
    if (selectedRole === 'sender') {
      if (inviteRecipient) {
        navigate('/wizard?step=contactPhone', { state: { ...location.state, inviteRecipient: true } })
      } else {
        navigate('/wizard?step=recipientPhone')
      }
    }
  }

  const handleRecipientPhoneContinue = () => {
    const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
    const returnToOffers = location.state?.returnToOffers || false
    
    if (selectedRole === 'sender') {
      if (inviteRecipient && returnToOffers) {
        const existingWizardData = location.state?.wizardData || {}
        const wizardData = {
          fromCity: fromCity.trim(),
          toCity: toCity.trim(),
          recipientPhone,
          selectedRole: 'sender',
          inviteRecipient: true,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery: existingWizardData.filterCourierDelivery
        }
        navigate('/offers', {
          state: { wizardData, recipientNotified: true }
        })
      } else {
        navigate('/wizard?step=payment')
      }
    }
  }

  const handlePaymentContinue = () => {
    if (paymentPayer === 'recipient') {
      const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
      const existingWizardData = location.state?.wizardData || {}
      const filterCourierDelivery = existingWizardData.filterCourierDelivery || false
      
      const updatedWizardData = {
        ...existingWizardData,
        needsPackaging: existingWizardData.needsPackaging === true
      }
      
      console.log('📊 handlePaymentContinue:', {
        paymentPayer,
        inviteRecipient,
        filterCourierDelivery,
        needsPackaging: updatedWizardData.needsPackaging,
        selectedOffer: selectedOffer ? {
          company_name: selectedOffer.company_name,
          tariff_code: selectedOffer.tariff_code
        } : null
      })
      
      if (inviteRecipient) {
        console.log('🚀 Переход на orderComplete (inviteRecipient)')
        navigate('/wizard?step=orderComplete', { 
          state: { 
            ...location.state, 
            wizardData: updatedWizardData,
            inviteRecipient: true 
          } 
        })
      } else {
        const needsPvz = selectedOffer && needsPvzSelection(selectedOffer, filterCourierDelivery)
        console.log('📊 needsPvz result:', needsPvz)
        if (needsPvz) {
          console.log('🚀 Переход на selectPvz')
          navigate('/wizard?step=selectPvz', { 
            state: { 
              ...location.state,
              wizardData: updatedWizardData
            } 
          })
        } else {
          console.log('🚀 Переход на orderComplete')
          navigate('/wizard?step=orderComplete', { 
            state: { 
              ...location.state,
              wizardData: updatedWizardData
            } 
          })
        }
      }
    } else if (paymentPayer === 'me') {
      const existingWizardData = location.state?.wizardData || {}
      const updatedWizardData = {
        ...existingWizardData,
        needsPackaging: existingWizardData.needsPackaging === true
      }
      console.log('🚀 Переход на recipientAddress')
      navigate('/wizard?step=recipientAddress', { 
        state: { 
          ...location.state,
          wizardData: updatedWizardData
        } 
      })
    }
  }

  const needsPvzSelection = (offer, filterCourierDelivery = false) => {
    console.log('🔍 WizardPage needsPvzSelection check:', {
      offer: offer ? {
        company_name: offer.company_name,
        company_code: offer.company_code,
        tariff_code: offer.tariff_code
      } : null,
      filterCourierDelivery
    })
    
    if (!offer) {
      console.log('❌ ПВЗ не нужен: нет оффера')
      return false
    }
    
    if (filterCourierDelivery) {
      console.log('❌ ПВЗ не нужен: filterCourierDelivery = true')
      return false
    }
    
    const isCDEK = offer.company_name === 'CDEK' || offer.company_code === 'cdek'
    if (!isCDEK) {
      console.log('❌ ПВЗ не нужен: не CDEK')
      return false
    }
    
    const tariffCode = offer.tariff_code
    if (!tariffCode) {
      console.log('❌ ПВЗ не нужен: нет tariff_code')
      return false
    }
    
    const PVZ_TARIFFS = [136, 138, 62, 63, 233, 234, 235, 236, 237, 238, 239, 240]
    const needsPvz = PVZ_TARIFFS.includes(tariffCode)
    
    if (needsPvz) {
      console.log('✅ ПВЗ нужен: тариф', tariffCode, 'в списке ПВЗ тарифов')
    } else {
      console.log('❌ ПВЗ не нужен: тариф', tariffCode, 'не в списке ПВЗ тарифов')
    }
    
    return needsPvz
  }

  const handleSelectPvzContinue = () => {
    if (!recipientDeliveryPointCode) {
      alert('Пожалуйста, выберите пункт выдачи')
      return
    }
    const existingWizardData = location.state?.wizardData || {}
    navigate('/wizard?step=email', {
      state: {
        ...location.state,
        wizardData: {
          ...existingWizardData,
          recipientDeliveryPointCode,
          recipientDeliveryPointAddress,
          needsPackaging: existingWizardData.needsPackaging === true
        }
      }
    })
  }

  const handleEmailContinue = () => {
    const existingWizardData = location.state?.wizardData || {}
    const existingWizardDataForPayment = {
      ...existingWizardData,
      needsPackaging: existingWizardData.needsPackaging === true
    }
    if (!selectedOffer) {
      console.error('Оффер не выбран')
      return
    }
    
    let wizardDataForPayment
    
    if (selectedRole === 'recipient') {
      const recipientPhoneToUse = recipientUserPhone || location.state?.wizardData?.recipientUserPhone || location.state?.wizardData?.recipientPhone
      const senderPhoneToUse = senderPhone || location.state?.wizardData?.senderPhone
      const senderFIOToUse = senderFIO || location.state?.wizardData?.senderFIO
      const recipientFIOToUse = recipientFIO || location.state?.wizardData?.recipientFIO
      const senderAddressToUse = senderAddress || location.state?.wizardData?.senderAddress
      const deliveryAddressToUse = deliveryAddress || location.state?.wizardData?.deliveryAddress
      
      const existingWizardDataRecipient = location.state?.wizardData || {}
      wizardDataForPayment = {
        fromCity,
        toCity,
        senderAddress: senderAddressToUse,
        deliveryAddress: deliveryAddressToUse,
        recipientAddress: deliveryAddressToUse,
        weight: weight || '1',
        length: length || '0',
        width: width || '0',
        height: height || '0',
        packageOption,
        selectedSize,
        estimatedValue,
        recipientPhone: recipientPhoneToUse,
        recipientUserPhone: recipientPhoneToUse,
        contactPhone: recipientPhoneToUse,
        senderPhone: senderPhoneToUse,
        recipientFIO: recipientFIOToUse,
        senderFIO: senderFIOToUse,
        senderName: senderFIOToUse,
        pickupSenderName: senderFIOToUse,
        recipientName: recipientFIOToUse,
        email,
        agreePersonalData,
        agreeMarketing,
        selectedOffer,
        recipientDeliveryPointCode,
        recipientDeliveryPointAddress,
        paymentPayer: 'me',
        selectedRole: 'recipient',
        photoUrl,
        needsPackaging: existingWizardDataRecipient.needsPackaging === true
      }
      console.log('📦 Формирование wizardDataForPayment (recipient):', {
        needsPackagingFromState: existingWizardDataRecipient.needsPackaging,
        finalNeedsPackaging: wizardDataForPayment.needsPackaging
      })
    } else {
      wizardDataForPayment = {
        fromCity,
        toCity,
        senderAddress: pickupAddress,
        deliveryAddress: recipientAddress,
        weight: weight || '1',
        length: length || '0',
        width: width || '0',
        height: height || '0',
        packageOption,
        selectedSize,
        estimatedValue,
        recipientPhone,
        contactPhone,
        recipientFIO,
        pickupSenderName,
        senderFIO: pickupSenderName,
        senderName: pickupSenderName,
        senderPhone: contactPhone,
        recipientName: recipientFIO,
        email,
        agreePersonalData,
        agreeMarketing,
        selectedOffer,
        recipientDeliveryPointCode,
        recipientDeliveryPointAddress,
        photoUrl,
        needsPackaging: existingWizardDataForPayment.needsPackaging === true
      }
      console.log('📦 Формирование wizardDataForPayment (sender):', {
        needsPackagingFromState: existingWizardDataForPayment.needsPackaging,
        finalNeedsPackaging: wizardDataForPayment.needsPackaging
      })
    }
    
    navigate('/payment', {
      state: {
        wizardData: wizardDataForPayment,
        company: selectedOffer.company_id,
        companyName: selectedOffer.company_name,
        companyCode: selectedOffer.company_code,
        companyLogo: selectedOffer.company_logo,
        price: selectedOffer.price,
        tariffCode: selectedOffer.tariff_code,
        tariffName: selectedOffer.tariff_name,
        deliveryTime: selectedOffer.delivery_time,
        insuranceCost: selectedOffer.insurance_cost || null
      }
    })
  }

  const handleRecipientAddressContinue = () => {
    if (!fromCity || !toCity) {
      console.error('Города не заполнены:', { fromCity, toCity })
      alert('Пожалуйста, укажите города отправления и назначения')
      return
    }

    const trimmedAddress = recipientAddress?.trim() || ''
    const hasHouseNumber = /\d/.test(trimmedAddress)
    
    if (!trimmedAddress || !hasHouseNumber || !recipientFIO) {
      return
    }

    const existingWizardData = location.state?.wizardData || {}
    const savedDelivery = localStorage.getItem('filterCourierDelivery')
    const filterCourierDelivery = existingWizardData.filterCourierDelivery !== undefined 
      ? existingWizardData.filterCourierDelivery 
      : (savedDelivery !== null ? savedDelivery === 'true' : false)
    
    const finalSelectedOffer = selectedOffer || existingWizardData.selectedOffer || location.state?.selectedOffer
    
    console.log('📊 handleRecipientAddressContinue:', {
      existingWizardDataFilterCourierDelivery: existingWizardData.filterCourierDelivery,
      savedDelivery,
      filterCourierDelivery,
      selectedOfferFromState: selectedOffer,
      selectedOfferFromWizardData: existingWizardData.selectedOffer,
      selectedOfferFromLocation: location.state?.selectedOffer,
      finalSelectedOffer
    })
    
    const wizardData = {
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      senderAddress: pickupAddress,
      pickupAddress: pickupAddress,
      deliveryAddress: recipientAddress,
      recipientAddress: recipientAddress,
      weight: weight || '1',
      length: length || '0',
      width: width || '0',
      height: height || '0',
      packageOption,
      selectedSize,
      estimatedValue,
      recipientPhone,
      contactPhone,
      recipientFIO,
      pickupSenderName,
      paymentPayer,
      selectedRole: 'sender',
      photoUrl,
      selectedOffer: finalSelectedOffer,
      returnToPayment: true,
      filterCourierPickup: existingWizardData.filterCourierPickup,
      filterCourierDelivery: filterCourierDelivery,
      needsPackaging: existingWizardData.needsPackaging === true
    }
    
    console.log('🚀 Переход на /offers с wizardData:', {
      ...wizardData,
      hasSelectedOffer: !!wizardData.selectedOffer,
      selectedOfferDetails: wizardData.selectedOffer
    })
    navigate('/offers', {
      state: { wizardData }
    })
  }

  const handleResendCode = async () => {
    if (contactPhone) {
      await handleSendCode('sms')
    }
  }

  const authObj = {
    codeSent,
    codeLoading,
    codeError,
    telegramSent,
    smsCode,
    setSmsCode: (code) => setSmsCode(code),
    resetCodeState: () => {
                        setCodeSent(false)
                        setSmsCode('')
                        setCodeError('')
                        setTelegramSent(false)
    },
    handleSendCode: handleSendCode
  }

  const getProgress = () => {
    if (currentStep === 'orderComplete') return 100
    if (currentStep === 'recipientAddress') return 90
    if (currentStep === 'payment') return 80
    if (currentStep === 'recipientPhone') return 70
    if (currentStep === 'pickupAddress') return 60
    if (currentStep === 'contactPhone') return codeSent ? 50 : 40
    if (currentStep === 'email') return 95
    if (currentStep === 'selectPvz') return 90
    if (currentStep === 'senderAddress') return 75
    if (currentStep === 'senderPhone') return 70
    if (currentStep === 'recipientUserPhone') return recipientUserCodeSent ? 65 : 60
    if (currentStep === 'deliveryAddress') return 50
    if (currentStep === 'recipientFIO') return 40
    if (currentStep === 'package') return 30
    if (selectedRole) return 20
    return 0
  }

  const getProgressText = () => {
    if (currentStep === 'orderComplete') return 'Готово'
    if (currentStep === 'email') return 'Электронный адрес'
    if (currentStep === 'selectPvz') return 'Выбор пункта выдачи'
    if (currentStep === 'recipientAddress') return 'Адрес получателя'
    if (currentStep === 'senderAddress') return 'Адрес отправителя и ФИО'
    if (currentStep === 'senderPhone') return 'Укажите номер отправителя'
    if (currentStep === 'recipientUserPhone') return 'Ваш телефон'
    if (currentStep === 'deliveryAddress') return 'Куда доставить посылку?'
    if (currentStep === 'recipientFIO') return 'Ваши данные'
    if (currentStep === 'payment') return 'Кто оплатит доставку?'
    if (currentStep === 'recipientPhone') return 'Телефон получателя'
    if (currentStep === 'pickupAddress') return 'Где забрать посылку?'
    if (currentStep === 'contactPhone') {
      const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
      return inviteRecipient ? 'Ваш телефон' : 'Как с вами связаться?'
    }
    if (currentStep === 'package') return 'Расскажите о посылке'
    if (selectedRole) return 'Выбрана роль'
    return 'Начните заполнение формы'
  }

  const handleBack = () => {
    const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
    
    if (currentStep === 'orderComplete') {
      if (inviteRecipient) {
        navigate('/wizard?step=contactPhone', { state: { ...location.state, inviteRecipient: true } })
      } else if (paymentPayer === 'recipient') {
        navigate('/wizard?step=payment')
                              } else {
        navigate('/wizard?step=recipientAddress')
      }
    } else if (currentStep === 'contactPhone' && inviteRecipient) {
      navigate('/wizard?step=pickupAddress', { state: { ...location.state, inviteRecipient: true } })
    } else if (currentStep === 'pickupAddress' && inviteRecipient) {
      const existingWizardData = location.state?.wizardData || {}
      navigate('/offers', {
        state: {
          wizardData: {
            fromCity,
            toCity,
            recipientPhone,
            selectedRole: 'sender',
            inviteRecipient: true,
            photoUrl,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery
          },
          recipientNotified: true
        }
      })
    } else if (currentStep === 'selectPvz') {
      const existingWizardData = location.state?.wizardData || {}
      navigate('/offers', {
        state: {
          wizardData: {
            fromCity,
            toCity,
            senderAddress: pickupAddress || senderAddress,
            deliveryAddress: recipientAddress || deliveryAddress,
            weight,
            length,
            width,
            height,
            packageOption,
            selectedSize,
            recipientPhone,
            contactPhone,
            recipientFIO,
            pickupSenderName,
            selectedOffer: selectedOffer || existingWizardData.selectedOffer,
            photoUrl,
            returnToPayment: true,
            needsPackaging: existingWizardData.needsPackaging === true,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery
          }
        }
      })
    } else if (currentStep === 'email') {
      const existingWizardData = location.state?.wizardData || {}
      navigate('/offers', {
        state: {
          wizardData: {
            fromCity,
            toCity,
            senderAddress: pickupAddress,
            deliveryAddress: recipientAddress,
            weight,
            length,
            width,
            height,
            packageOption,
            selectedSize,
            recipientPhone,
            contactPhone,
            recipientFIO,
            pickupSenderName,
            selectedOffer: selectedOffer || existingWizardData.selectedOffer,
            photoUrl,
            returnToPayment: true,
            needsPackaging: existingWizardData.needsPackaging === true,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery
          }
        }
      })
    } else if (currentStep === 'recipientAddress') {
      navigate('/wizard?step=payment')
    } else if (currentStep === 'payment') {
      navigate('/wizard?step=recipientPhone')
    } else if (currentStep === 'recipientPhone') {
      navigate('/wizard?step=pickupAddress')
    } else if (currentStep === 'pickupAddress') {
      navigate('/wizard?step=contactPhone')
    } else if (currentStep === 'contactPhone') {
      navigate('/wizard?step=package')
      if (codeSent) {
                        setCodeSent(false)
                        setSmsCode('')
                        setCodeError('')
                        setTelegramSent(false)
      }
    } else if (currentStep === 'senderAddress') {
      navigate('/wizard?step=senderPhone')
    } else if (currentStep === 'senderPhone') {
      navigate('/wizard?step=recipientUserPhone')
    } else if (currentStep === 'recipientUserPhone') {
      if (recipientUserCodeSent) {
        setRecipientUserCodeSent(false)
        setRecipientUserSmsCode('')
        setRecipientUserCodeError('')
        setRecipientUserTelegramSent(false)
      }
      navigate('/wizard?step=deliveryAddress')
    } else if (currentStep === 'deliveryAddress') {
      navigate('/wizard?step=recipientFIO')
    } else if (currentStep === 'recipientFIO') {
      navigate('/wizard?step=package')
    } else if (currentStep === 'package') {
      navigate('/wizard?step=role')
      setSelectedRole(null)
    } else {
      navigate('/calculate')
    }
  }

  return (
    <WizardLayout
      fromCity={fromCity}
      toCity={toCity}
      onFromCityChange={(e) => setFromCity(e.target.value)}
      onToCityChange={(e) => setToCity(e.target.value)}
      onCalculate={handleCalculate}
      progress={getProgress()}
      progressText={getProgressText()}
      onBack={handleBack}
    >
      {currentStep === 'role' ? (
        <RoleSelectStep
          onRoleSelect={handleRoleSelect}
          selectedRole={selectedRole}
        />
      ) : currentStep === 'package' ? (
        <PackageStep
          packageOption={packageOption}
          onPackageOptionChange={setPackageOption}
          photoPreview={photoPreview}
          photoError={photoError}
          photoAnalyzing={photoAnalyzing}
          photoAnalysis={photoAnalysis}
          onPhotoChange={handlePhotoChange}
          onPhotoRemove={handlePhotoRemove}
          length={length}
          onLengthChange={(e) => setLength(e.target.value)}
          width={width}
          onWidthChange={(e) => setWidth(e.target.value)}
          height={height}
          onHeightChange={(e) => setHeight(e.target.value)}
          weight={weight}
          onWeightChange={(e) => setWeight(e.target.value)}
          estimatedValue={estimatedValue}
          onEstimatedValueChange={(e) => setEstimatedValue(e.target.value)}
          selectedSize={selectedSize}
          onSelectedSizeChange={setSelectedSize}
          onContinue={handlePackageContinue}
        />
      ) : currentStep === 'contactPhone' && selectedRole === 'sender' ? (
        <ContactPhoneStep
          phone={contactPhone}
          onPhoneChange={(e) => setContactPhone(e.target.value)}
          auth={authObj}
          selectedRole={selectedRole}
          title={(location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient) ? 'Ваш телефон' : undefined}
          description={(location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient) ? 'Это необходимо для оформления заказа' : undefined}
          onVerifyCode={handleVerifyCode}
          onResendCode={handleResendCode}
        />
      ) : currentStep === 'pickupAddress' && selectedRole === 'sender' ? (
        <PickupAddressStep
          pickupAddress={pickupAddress}
          onPickupAddressChange={(e) => setPickupAddress(e.target.value)}
          pickupSenderName={pickupSenderName}
          onPickupSenderNameChange={(e) => setPickupSenderName(e.target.value)}
          fromCity={fromCity}
          onContinue={handlePickupAddressContinue}
        />
      ) : currentStep === 'recipientPhone' && selectedRole === 'sender' ? (
        <RecipientPhoneStep
          recipientPhone={recipientPhone}
          onRecipientPhoneChange={(e) => setRecipientPhone(e.target.value)}
          onContinue={handleRecipientPhoneContinue}
        />
      ) : currentStep === 'payment' && selectedRole === 'sender' ? (
        <PaymentStep
          paymentPayer={paymentPayer}
          onPaymentPayerChange={setPaymentPayer}
          selectedRole={selectedRole}
          onContinue={handlePaymentContinue}
        />
      ) : currentStep === 'recipientFIO' && selectedRole === 'recipient' ? (
        <RecipientFIOStep
          recipientFIO={recipientFIO}
          onRecipientFIOChange={(e) => setRecipientFIO(e.target.value)}
          recipientFioFocused={recipientFioFocused}
          onRecipientFioFocus={() => setRecipientFioFocused(true)}
          onRecipientFioBlur={() => setRecipientFioFocused(false)}
          onContinue={handleRecipientFIOContinue}
        />
      ) : currentStep === 'deliveryAddress' && selectedRole === 'recipient' ? (
        <DeliveryAddressStep
          deliveryAddress={deliveryAddress}
          onDeliveryAddressChange={(e) => {
            setDeliveryAddress(e.target.value)
            if (deliveryAddressError) {
              setDeliveryAddressError('')
            }
          }}
          toCity={toCity}
          onContinue={handleDeliveryAddressContinue}
          error={deliveryAddressError}
        />
      ) : currentStep === 'recipientUserPhone' && selectedRole === 'recipient' ? (
        <ContactPhoneStep
          phone={recipientUserPhone}
          onPhoneChange={(e) => setRecipientUserPhone(e.target.value)}
          selectedRole={selectedRole}
          title="Ваш телефон"
          description="Это необходимо для оформления заказа"
          auth={{
            codeSent: recipientUserCodeSent,
            codeLoading: recipientUserCodeLoading,
            codeError: recipientUserCodeError,
            smsCode: recipientUserSmsCode,
            setSmsCode: setRecipientUserSmsCode,
            telegramSent: recipientUserTelegramSent,
            resetCodeState: () => {
              setRecipientUserCodeSent(false)
              setRecipientUserSmsCode('')
              setRecipientUserCodeError('')
              setRecipientUserTelegramSent(false)
            },
            handleSendCode: handleRecipientUserSendCode
          }}
          onVerifyCode={handleRecipientUserVerifyCode}
          onResendCode={handleRecipientUserResendCode}
        />
      ) : currentStep === 'senderPhone' && selectedRole === 'recipient' ? (
        <SenderPhoneStep
          senderPhone={senderPhone}
          onSenderPhoneChange={(e) => setSenderPhone(e.target.value)}
          onContinue={handleSenderPhoneContinue}
        />
      ) : currentStep === 'senderAddress' && selectedRole === 'recipient' ? (
        <SenderAddressStep
          senderAddress={senderAddress}
          onSenderAddressChange={(e) => setSenderAddress(e.target.value)}
          senderFIO={senderFIO}
          onSenderFIOChange={(e) => setSenderFIO(e.target.value)}
          fioFocused={senderFioFocused}
          onFioFocus={() => setSenderFioFocused(true)}
          onFioBlur={() => setSenderFioFocused(false)}
          fromCity={fromCity}
          onContinue={handleSenderAddressContinue}
        />
      ) : currentStep === 'recipientAddress' && selectedRole === 'sender' ? (
        <RecipientAddressStep
          recipientAddress={recipientAddress}
          onRecipientAddressChange={(e) => setRecipientAddress(e.target.value)}
          recipientFIO={recipientFIO}
          onRecipientFIOChange={(e) => setRecipientFIO(e.target.value)}
          recipientFioFocused={recipientFioFocused}
          onRecipientFioFocus={() => setRecipientFioFocused(true)}
          onRecipientFioBlur={() => setRecipientFioFocused(false)}
          toCity={toCity}
          onContinue={handleRecipientAddressContinue}
        />
      ) : currentStep === 'selectPvz' && selectedOffer && needsPvzSelection(selectedOffer, location.state?.wizardData?.filterCourierDelivery || false) ? (
        <SelectPvzStep
          toCity={toCity}
          fromCity={fromCity}
          recipientAddress={recipientAddress || deliveryAddress}
          senderAddress={pickupAddress || senderAddress}
          selectedOffer={selectedOffer}
          weight={weight}
          length={length}
          width={width}
          height={height}
          recipientDeliveryPointCode={recipientDeliveryPointCode}
          onSelect={(point) => {
            setRecipientDeliveryPointCode(point.code)
            setRecipientDeliveryPointAddress(point.address)
          }}
          onContinue={handleSelectPvzContinue}
        />
      ) : currentStep === 'email' ? (
        <EmailStep
          email={email}
          onEmailChange={(e) => setEmail(e.target.value)}
          emailFocused={emailFocused}
          onEmailFocus={() => setEmailFocused(true)}
          onEmailBlur={() => setEmailFocused(false)}
          agreePersonalData={agreePersonalData}
          onAgreePersonalDataChange={(e) => setAgreePersonalData(e.target.checked)}
          agreeMarketing={agreeMarketing}
          onAgreeMarketingChange={(e) => setAgreeMarketing(e.target.checked)}
          loadingOffers={false}
          onContinue={handleEmailContinue}
        />
      ) : currentStep === 'orderComplete' && selectedRole === 'sender' ? (
        (() => {
          const inviteRecipient = location.state?.inviteRecipient || location.state?.wizardData?.inviteRecipient || false
          const filterCourierDelivery = location.state?.wizardData?.filterCourierDelivery || false
          if (inviteRecipient) {
            return <OrderCompleteStep />
          }
          if (selectedOffer && needsPvzSelection(selectedOffer, filterCourierDelivery)) {
            return (
              <SelectPvzStep
                toCity={toCity}
                fromCity={fromCity}
                recipientAddress={recipientAddress || deliveryAddress}
                senderAddress={pickupAddress || senderAddress}
                selectedOffer={selectedOffer}
                weight={weight}
                length={length}
                width={width}
                height={height}
                recipientDeliveryPointCode={recipientDeliveryPointCode}
                    onSelect={(point) => {
                      setRecipientDeliveryPointCode(point.code)
                      setRecipientDeliveryPointAddress(point.address)
                    }}
                onContinue={handleSelectPvzContinue}
              />
            )
          }
          return <OrderCompleteStep />
        })()
      ) : null}
    </WizardLayout>
  )
}

export default WizardPage
