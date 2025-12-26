import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const PVZ_REQUIRED_TARIFFS = [136, 138, 234, 236]

export const isValidStep = (step) => {
  const validSteps = ['package', 'userPhone', 'deliveryAddress', 'contactPhone', 'senderPhone', 'senderAddress', 'recipientPhone', 'payment', 'email', 'selectPvz', 'orderComplete', 'pickupAddress', 'deliveryMethod', 'senderFIO']
  return validSteps.includes(step)
}

export const useWizardData = () => {
  const location = useLocation()
  const { fromCity: initialFromCity, toCity: initialToCity, inviteRecipient: initialInviteRecipient, selectedRole: initialSelectedRole } = location.state || {}
  
  const [fromCity, setFromCity] = useState(initialFromCity || '')
  const [toCity, setToCity] = useState(initialToCity || '')
  const [selectedRole, setSelectedRole] = useState(initialSelectedRole || null)
  const [inviteRecipient, setInviteRecipient] = useState(initialInviteRecipient || false)
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
  const [userFIO, setUserFIO] = useState('')
  const [userFioFocused, setUserFioFocused] = useState(false)
  const [smsCode, setSmsCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [telegramSent, setTelegramSent] = useState(false)
  const [paymentPayer, setPaymentPayer] = useState(null)
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
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupSenderName, setPickupSenderName] = useState('')
  const [pickupSenderNameFocused, setPickupSenderNameFocused] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(location.state?.selectedOffer || null)
  const [returnToPayment, setReturnToPayment] = useState(false)
  const [recipientDeliveryPointCode, setRecipientDeliveryPointCode] = useState('')
  const [recipientDeliveryPointAddress, setRecipientDeliveryPointAddress] = useState('')
  const [fioFocused, setFioFocused] = useState(false)

  // Восстановление данных из location.state или URL
  useEffect(() => {
    if (toCity) {
      setDeliveryAddress(toCity)
      setRecipientAddress(toCity)
    }
    if (fromCity) {
      setSenderAddress(fromCity)
    }
  }, [toCity, fromCity])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const encoded = urlParams.get('data')
    const stepParam = urlParams.get('step')
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
    
    const state = location.state
    const data = state?.wizardData || wizardDataFromUrl
    
    if (data?.selectedRole) {
      setSelectedRole(data.selectedRole)
    }
    
    if (data?.inviteRecipient !== undefined) {
      setInviteRecipient(data.inviteRecipient)
    } else if (state?.inviteRecipient !== undefined) {
      setInviteRecipient(state.inviteRecipient)
    }
    
    const offer = state?.selectedOffer || data?.selectedOffer || (state?.wizardData?.selectedOffer) || (wizardDataFromUrl?.selectedOffer)
    
    if (offer) {
      setSelectedOffer(offer)
    }
    
    if (data) {
      if (data.fromCity) setFromCity(data.fromCity)
      if (data.toCity) setToCity(data.toCity)
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
      if (data.recipientDeliveryPointCode) setRecipientDeliveryPointCode(data.recipientDeliveryPointCode)
      if (data.recipientDeliveryPointAddress) setRecipientDeliveryPointAddress(data.recipientDeliveryPointAddress)
      if (data.userFIO) setUserFIO(data.userFIO)
    }
  }, [location.state, location.search])

  return {
    // Cities
    fromCity,
    setFromCity,
    toCity,
    setToCity,
    
    // Role
    selectedRole,
    setSelectedRole,
    
    // Package
    packageOption,
    setPackageOption,
    length,
    setLength,
    width,
    setWidth,
    height,
    setHeight,
    weight,
    setWeight,
    estimatedValue,
    setEstimatedValue,
    photoFile,
    setPhotoFile,
    photoPreview,
    setPhotoPreview,
    photoError,
    setPhotoError,
    selectedSize,
    setSelectedSize,
    packageDataCompleted,
    setPackageDataCompleted,
    
    // Sender
    senderPhone,
    setSenderPhone,
    senderFIO,
    setSenderFIO,
    senderAddress,
    setSenderAddress,
    fioFocused,
    setFioFocused,
    
    // Delivery
    deliveryAddress,
    setDeliveryAddress,
    deliveryMethod,
    setDeliveryMethod,
    
    // User
    userPhone,
    setUserPhone,
    userFIO,
    setUserFIO,
    userFioFocused,
    setUserFioFocused,
    
    // Code verification
    smsCode,
    setSmsCode,
    codeSent,
    setCodeSent,
    codeLoading,
    setCodeLoading,
    codeError,
    setCodeError,
    telegramSent,
    setTelegramSent,
    
    // Contact
    contactPhone,
    setContactPhone,
    
    // Recipient
    recipientPhone,
    setRecipientPhone,
    recipientAddress,
    setRecipientAddress,
    recipientFIO,
    setRecipientFIO,
    recipientFioFocused,
    setRecipientFioFocused,
    
    // Email
    email,
    setEmail,
    emailFocused,
    setEmailFocused,
    agreePersonalData,
    setAgreePersonalData,
    agreeMarketing,
    setAgreeMarketing,
    
    // Pickup
    pickupAddress,
    setPickupAddress,
    pickupSenderName,
    setPickupSenderName,
    pickupSenderNameFocused,
    setPickupSenderNameFocused,
    
    // Payment
    paymentPayer,
    setPaymentPayer,
    
    // Offer
    selectedOffer,
    setSelectedOffer,
    returnToPayment,
    setReturnToPayment,
    
    // Delivery point
    recipientDeliveryPointCode,
    setRecipientDeliveryPointCode,
    recipientDeliveryPointAddress,
    setRecipientDeliveryPointAddress,
    
    // Location
    location,
    inviteRecipient,
  }
}

