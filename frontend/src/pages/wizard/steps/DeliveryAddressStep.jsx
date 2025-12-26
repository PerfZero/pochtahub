import AddressInput from '../../../components/AddressInput'

function DeliveryAddressStep({
  deliveryAddress,
  onDeliveryAddressChange,
  toCity,
  onContinue,
  error
}) {
  const trimmedAddress = deliveryAddress.trim()
  const hasHouseNumber = /\d/.test(trimmedAddress)
  const isDisabled = !trimmedAddress || !hasHouseNumber
  
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Куда доставить посылку?
      </h1>
      <div className="mb-6">
        <AddressInput
          value={deliveryAddress}
          onChange={onDeliveryAddressChange}
          label="Адрес"
          city={toCity}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
      <button 
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  )
}

export default DeliveryAddressStep

