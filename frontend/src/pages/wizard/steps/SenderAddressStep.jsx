import AddressInput from '../../../components/AddressInput'

function SenderAddressStep({
  senderAddress,
  onSenderAddressChange,
  senderFIO,
  onSenderFIOChange,
  fioFocused,
  onFioFocus,
  onFioBlur,
  fromCity,
  onContinue
}) {
  const trimmedAddress = senderAddress?.trim() || ''
  const hasHouseNumber = /\d/.test(trimmedAddress)
  const isAddressValid = trimmedAddress && hasHouseNumber
  const isDisabled = !isAddressValid || !senderFIO

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Пожалуйста, укажите адрес отправителя и ФИО
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Укажите точный адрес отправителя с номером дома и ваше полное имя
      </p>
      <div className="mb-6">
        <AddressInput
          value={senderAddress}
          onChange={onSenderAddressChange}
          label="Адрес"
          city={fromCity}
        />
        {trimmedAddress && !hasHouseNumber && (
          <p className="text-red-500 text-sm mt-2">Укажите номер дома в адресе</p>
        )}
      </div>
      <div className="mb-6">
        <div className="relative">
          <div className={`relative border rounded-xl ${
            fioFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
          }`}>
            <input
              type="text"
              value={senderFIO}
              onChange={onSenderFIOChange}
              onFocus={onFioFocus}
              onBlur={onFioBlur}
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
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  )
}

export default SenderAddressStep

