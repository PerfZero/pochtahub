import { useState } from 'react'
import { authAPI } from '../api'

export const useWizardAuth = () => {
  const [smsCode, setSmsCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [telegramSent, setTelegramSent] = useState(false)

  const handleSendCode = async (phone, method = 'telegram') => {
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
        return true
      } else {
        setCodeError(response.data?.error || 'Ошибка отправки кода')
        return false
      }
    } catch (err) {
      const errorData = err.response?.data
      setCodeError(errorData?.error || err.message || 'Ошибка отправки кода')
      return false
    } finally {
      setCodeLoading(false)
    }
  }

  const handleVerifyCode = async (phone, code) => {
    if (!code || code.length !== 4) {
      setCodeError('Введите код')
      return false
    }
    setCodeLoading(true)
    setCodeError('')
    try {
      const response = await authAPI.verifyCode(phone, code)
      setCodeSent(false)
      setSmsCode('')
      setCodeError('')
      setTelegramSent(false)
      return true
    } catch (err) {
      setCodeError(err.response?.data?.error || err.message || 'Неверный код')
      return false
    } finally {
      setCodeLoading(false)
    }
  }

  const resetCodeState = () => {
    setCodeSent(false)
    setSmsCode('')
    setCodeError('')
    setTelegramSent(false)
  }

  return {
    smsCode,
    setSmsCode,
    codeSent,
    setCodeSent,
    codeLoading,
    codeError,
    telegramSent,
    handleSendCode,
    handleVerifyCode,
    resetCodeState,
  }
}



