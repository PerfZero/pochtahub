import SeparatedAddressInput from '../../../components/SeparatedAddressInput'

function DeliveryAddressStep({
  deliveryAddress,
  onDeliveryAddressChange,
  toCity,
  onContinue,
  error
}) {
  // Простая функция для базового разделения адреса (только для ручного ввода)
  const parseAddress = (address) => {
    if (!address) return { street: address || '', house: '', apartment: '' }
    
    // Если есть запятые, пытаемся разделить
    const parts = address.split(',')
    
    if (parts.length === 1) {
      // Простая улица без дома и квартиры
      return { street: address.trim(), house: '', apartment: '' }
    }
    
    // Ищем квартиру
    let apartment = ''
    let streetAndHouse = parts.slice(0, -1).join(',')
    
    const lastPart = parts[parts.length - 1].trim()
    if (lastPart.match(/^(кв|квартира|офис|оф)\s*/i)) {
      apartment = lastPart.replace(/^(кв|квартира|офис|оф)\s*/i, '').trim()
    } else {
      streetAndHouse = address
    }
    
    // Ищем дом в streetAndHouse
    const houseMatch = streetAndHouse.match(/,\s*(?:д|дом|влд|владение|стр|строение)\s*([0-9а-яА-Я\/-]+)/i)
    const house = houseMatch ? houseMatch[1] : ''
    const street = houseMatch ? streetAndHouse.replace(/,\s*(?:д|дом|влд|владение|стр|строение)\s*[0-9а-яА-Я\/-]+/i, '').trim() : streetAndHouse.trim()
    
    return { street, house, apartment }
  }
  
  const { street, house, apartment } = parseAddress(deliveryAddress)
  
  const isAddressValid = street.trim()
  const isDisabled = !isAddressValid
  
  const handleStreetChange = (e) => {
    const newStreet = e.target.value
    const newAddress = `${newStreet}${house ? `, д ${house}` : ''}${apartment ? `, кв ${apartment}` : ''}`
    onDeliveryAddressChange({ target: { value: newAddress } })
  }

  const handleHouseChange = (e) => {
    const newHouse = e.target.value
    const newAddress = `${street}${newHouse ? `, д ${newHouse}` : ''}${apartment ? `, кв ${apartment}` : ''}`
    onDeliveryAddressChange({ target: { value: newAddress } })
  }

  const handleApartmentChange = (e) => {
    const newApartment = e.target.value
    const newAddress = `${street}${house ? `, д ${house}` : ''}${newApartment ? `, кв ${newApartment}` : ''}`
    onDeliveryAddressChange({ target: { value: newAddress } })
  }
  
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Куда доставить посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Укажите точный адрес доставки с номером дома
      </p>
      <div className="mb-6">
        <SeparatedAddressInput
          street={street}
          house={house}
          apartment={apartment}
          onStreetChange={handleStreetChange}
          onHouseChange={handleHouseChange}
          onApartmentChange={handleApartmentChange}
          label="Адрес"
          city={toCity}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        {street && !house && !error && (
          <p className="text-yellow-600 text-sm mt-2">Укажите номер дома для более точного адреса</p>
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

