import AddressInput from '../../../components/AddressInput'

function DeliveryAddressStep({
  deliveryAddress,
  onDeliveryAddressChange,
  toCity,
  onContinue
}) {
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
      </div>
      <button 
        onClick={onContinue}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold"
      >
        Продолжить
      </button>
    </div>
  )
}

export default DeliveryAddressStep

