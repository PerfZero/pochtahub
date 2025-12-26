import PhoneInput from '../../../components/PhoneInput'

function SenderPhoneStep({
  senderPhone,
  onSenderPhoneChange,
  onContinue
}) {
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Укажите номер отправителя
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        мы свяжемся с отправителем, номер нужен для оформления и связи с курьером
      </p>
      <div className="mb-6">
        <PhoneInput
          value={senderPhone}
          onChange={onSenderPhoneChange}
          label="Телефон отправителя"
        />
      </div>
      <button 
        onClick={onContinue}
        disabled={!senderPhone}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  )
}

export default SenderPhoneStep

