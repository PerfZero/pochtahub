export const ASSISTANT_STEPS = {
  RECIPIENT_PHONE: 'recipientPhone',
  PICKUP_ADDRESS: 'pickupAddress',
  CONTACT_PHONE: 'contactPhone',
  ORDER_COMPLETE: 'orderComplete'
}

export const isValidStep = (step) => {
  return Object.values(ASSISTANT_STEPS).includes(step)
}

export const getInitialStep = (location, wizardData) => {
  const stepParam = new URLSearchParams(location.search).get('step')
  if (stepParam && isValidStep(stepParam)) {
    return stepParam
  }
  
  const stepFromState = location.state?.currentStep
  if (stepFromState && isValidStep(stepFromState)) {
    return stepFromState
  }
  
  const offer = location.state?.selectedOffer || location.state?.wizardData?.selectedOffer
  if (offer && wizardData.recipientPhone) {
    if (wizardData.pickupAddress && wizardData.pickupSenderName) {
      return ASSISTANT_STEPS.CONTACT_PHONE
    }
    return ASSISTANT_STEPS.PICKUP_ADDRESS
  }
  
  return ASSISTANT_STEPS.RECIPIENT_PHONE
}

export const getNextStep = (currentStep, data) => {
  const { recipientPhone, pickupAddress, pickupSenderName, contactPhone, auth } = data
  
  switch (currentStep) {
    case ASSISTANT_STEPS.RECIPIENT_PHONE:
      if (recipientPhone) {
        return 'navigate_to_offers'
      }
      return null
      
    case ASSISTANT_STEPS.PICKUP_ADDRESS:
      if (pickupAddress && pickupSenderName) {
        return ASSISTANT_STEPS.CONTACT_PHONE
      }
      return null
      
    case ASSISTANT_STEPS.CONTACT_PHONE:
      if (contactPhone && !auth.codeSent) {
        return 'send_code'
      }
      if (auth.codeSent) {
        return ASSISTANT_STEPS.ORDER_COMPLETE
      }
      return null
      
    case ASSISTANT_STEPS.ORDER_COMPLETE:
      return null
      
    default:
      return null
  }
}

export const getProgress = (currentStep, auth) => {
  if (currentStep === ASSISTANT_STEPS.ORDER_COMPLETE) return 100
  if (currentStep === ASSISTANT_STEPS.CONTACT_PHONE && auth.codeSent) return 90
  if (currentStep === ASSISTANT_STEPS.CONTACT_PHONE) return 80
  if (currentStep === ASSISTANT_STEPS.PICKUP_ADDRESS) return 60
  if (currentStep === ASSISTANT_STEPS.RECIPIENT_PHONE) return 40
  return 0
}

export const getProgressText = (currentStep) => {
  if (currentStep === ASSISTANT_STEPS.ORDER_COMPLETE) return 'Готово!'
  if (currentStep === ASSISTANT_STEPS.CONTACT_PHONE) return 'Уже подбираем транспортные компании...'
  if (currentStep === ASSISTANT_STEPS.PICKUP_ADDRESS) return 'Уже подбираем транспортные компании...'
  return 'Осталось еще чуть-чуть...'
}

