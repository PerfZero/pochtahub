// AssistantWizard - компонент для ассистента (inviteRecipient)
// Флоу: recipientPhone → offers → pickupAddress → contactPhone → orderComplete

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWizardData } from '../../hooks/useWizardData'
import { useWizardAuth } from '../../hooks/useWizardAuth'
import WizardLayout from '../../components/wizard/WizardLayout'
import RecipientPhoneStep from './steps/RecipientPhoneStep'
import PickupAddressStep from './steps/PickupAddressStep'
import ContactPhoneStep from './steps/ContactPhoneStep'
import OrderCompleteStep from './steps/OrderCompleteStep'

const ASSISTANT_STEPS = {
  RECIPIENT_PHONE: 'recipientPhone',
  PICKUP_ADDRESS: 'pickupAddress',
  CONTACT_PHONE: 'contactPhone',
  ORDER_COMPLETE: 'orderComplete'
}

function AssistantWizard() {
  const location = useLocation()
  const navigate = useNavigate()
  const wizardData = useWizardData()
  const auth = useWizardAuth()
  
  const {
    fromCity, setFromCity,
    toCity, setToCity,
    contactPhone, setContactPhone,
    recipientPhone, setRecipientPhone,
    pickupAddress, setPickupAddress,
    pickupSenderName, setPickupSenderName,
  } = wizardData

  const [currentStep, setCurrentStep] = useState(() => {
    if (location.state?.currentStep) {
      return location.state.currentStep
    }
    return ASSISTANT_STEPS.RECIPIENT_PHONE
  })

  useEffect(() => {
    const stepFromState = location.state?.currentStep
    if (stepFromState && Object.values(ASSISTANT_STEPS).includes(stepFromState)) {
      setCurrentStep(stepFromState)
    }
  }, [location.state?.currentStep])

  const handleContinue = () => {
    let nextStep = null

    if (currentStep === ASSISTANT_STEPS.RECIPIENT_PHONE && recipientPhone) {
      nextStep = 'navigate_to_offers'
    } else if (currentStep === ASSISTANT_STEPS.PICKUP_ADDRESS && pickupAddress && pickupSenderName) {
      nextStep = ASSISTANT_STEPS.CONTACT_PHONE
    } else if (currentStep === ASSISTANT_STEPS.CONTACT_PHONE && contactPhone && !auth.codeSent) {
      nextStep = 'send_code'
    }

    if (nextStep === 'navigate_to_offers') {
      const existingWizardData = location.state?.wizardData || {}
      const updatedWizardData = {
        fromCity,
        toCity,
        recipientPhone,
        selectedRole: 'sender',
        inviteRecipient: true,
        filterCourierPickup: existingWizardData.filterCourierPickup,
        filterCourierDelivery: existingWizardData.filterCourierDelivery
      }
      try {
        const jsonString = JSON.stringify(updatedWizardData)
        const encoded = btoa(unescape(encodeURIComponent(jsonString)))
        navigate(`/offers?data=${encodeURIComponent(encoded)}`, {
          state: { wizardData: updatedWizardData, returnToOffers: true }
        })
      } catch (err) {
        navigate('/offers', {
          state: { wizardData: updatedWizardData, returnToOffers: true }
        })
      }
    } else if (nextStep === 'send_code') {
      auth.handleSendCode(contactPhone, 'sms').then((success) => {
        if (success) {
          wizardData.setUserPhone(contactPhone)
        }
      })
    } else if (nextStep) {
      setCurrentStep(nextStep)
    }
  }

  const handleVerifyCodeAndContinue = async (code) => {
    const success = await auth.handleVerifyCode(contactPhone, code)
    if (success) {
      wizardData.setUserPhone(contactPhone)
      setCurrentStep(ASSISTANT_STEPS.ORDER_COMPLETE)
    }
  }

  const handleCalculate = () => {
    if (!fromCity || !toCity) return
    const existingWizardData = location.state?.wizardData || {}
    const wizardDataForOffers = {
      fromCity,
      toCity,
      selectedRole: 'sender',
      inviteRecipient: true,
      filterCourierPickup: existingWizardData.filterCourierPickup,
      filterCourierDelivery: existingWizardData.filterCourierDelivery
    }
    navigate('/offers', { state: { wizardData: wizardDataForOffers } })
  }


  const renderStep = () => {
    switch (currentStep) {
      case ASSISTANT_STEPS.RECIPIENT_PHONE:
        return (
          <RecipientPhoneStep
            recipientPhone={recipientPhone}
            onRecipientPhoneChange={(e) => setRecipientPhone(e.target.value)}
            onContinue={handleContinue}
          />
        )

      case ASSISTANT_STEPS.PICKUP_ADDRESS:
        return (
          <PickupAddressStep
            pickupAddress={pickupAddress}
            onPickupAddressChange={(e) => setPickupAddress(e.target.value)}
            pickupSenderName={pickupSenderName}
            onPickupSenderNameChange={(e) => setPickupSenderName(e.target.value)}
            fromCity={fromCity}
            onContinue={handleContinue}
          />
        )

      case ASSISTANT_STEPS.CONTACT_PHONE:
        return (
          <ContactPhoneStep
            contactPhone={contactPhone}
            onContactPhoneChange={(e) => setContactPhone(e.target.value)}
            auth={auth}
            onContinue={handleContinue}
            onVerifyCode={handleVerifyCodeAndContinue}
          />
        )

      case ASSISTANT_STEPS.ORDER_COMPLETE:
        return <OrderCompleteStep />

      default:
        return null
    }
  }

  return (
    <WizardLayout
      fromCity={fromCity}
      toCity={toCity}
      onFromCityChange={(e) => setFromCity(e.target.value)}
      onToCityChange={(e) => setToCity(e.target.value)}
      onCalculate={handleCalculate}
      progress={currentStep === ASSISTANT_STEPS.ORDER_COMPLETE ? 100 : currentStep === ASSISTANT_STEPS.CONTACT_PHONE ? (auth.codeSent ? 75 : 50) : currentStep === ASSISTANT_STEPS.PICKUP_ADDRESS ? 60 : 30}
      progressText={currentStep === ASSISTANT_STEPS.ORDER_COMPLETE ? 'Готово!' : 'Уже подбираем транспортные компании...'}
    >
      {renderStep()}
    </WizardLayout>
  )
}

export default AssistantWizard
