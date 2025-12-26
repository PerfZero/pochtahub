function PaymentStep({
  paymentPayer,
  onPaymentPayerChange,
  selectedRole,
  onContinue
}) {
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Кто оплатит доставку?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <button
          onClick={() => onPaymentPayerChange('me')}
          className={`p-4 md:p-6 rounded-xl border transition-all ${
            paymentPayer === 'me'
              ? 'border-[#0077FE] bg-[#F0F7FF]'
              : 'border-[#E5E5E5] bg-white hover:border-[#0077FE]'
          }`}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
              💸
            </div>
            <p className="text-sm md:text-base font-semibold text-[#2D2D2D] text-center">Я оплачу</p>
          </div>
        </button>
        <button
          onClick={() => onPaymentPayerChange(selectedRole === 'sender' ? 'recipient' : 'sender')}
          className={`p-4 md:p-6 rounded-xl border transition-all ${
            (selectedRole === 'sender' && paymentPayer === 'recipient') || (selectedRole === 'recipient' && paymentPayer === 'sender')
              ? 'border-[#0077FE] bg-[#F0F7FF]'
              : 'border-[#E5E5E5] bg-white hover:border-[#0077FE]'
          }`}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
            🙎‍♂️
            </div>
            <p className="text-sm md:text-base font-semibold text-[#2D2D2D] text-center">
              {selectedRole === 'sender' ? 'Получатель оплатит по ссылке' : 'Отправитель оплатит'}
            </p>
          </div>
        </button>
      </div>
      <button 
        onClick={onContinue}
        disabled={!paymentPayer}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  )
}

export default PaymentStep

