import { useState } from 'react'
import SeparatedAddressInput from '../../../components/SeparatedAddressInput'

function DeliveryMethodStep({
  deliveryMethod,
  onDeliveryMethodChange,
  senderAddress,
  onSenderAddressChange,
  fromCity,
  onContinue
}) {
  const [senderAddressFocused, setSenderAddressFocused] = useState(false)
  
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
  
  const { street, house, apartment } = parseAddress(senderAddress)
  
  const isAddressValid = street.trim()
  const isDisabled = !deliveryMethod || (deliveryMethod === 'courier' && !isAddressValid)
  const handleStreetChange = (e) => {
    const newStreet = e.target.value
    const newAddress = `${newStreet}${house ? `, д ${house}` : ''}${apartment ? `, кв ${apartment}` : ''}`
    onSenderAddressChange({ target: { value: newAddress } })
  }

  const handleHouseChange = (e) => {
    const newHouse = e.target.value
    const newAddress = `${street}${newHouse ? `, д ${newHouse}` : ''}${apartment ? `, кв ${apartment}` : ''}`
    onSenderAddressChange({ target: { value: newAddress } })
  }

  const handleApartmentChange = (e) => {
    const newApartment = e.target.value
    const newAddress = `${street}${house ? `, д ${house}` : ''}${newApartment ? `, кв ${newApartment}` : ''}`
    onSenderAddressChange({ target: { value: newAddress } })
  }

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Как вы хотите передать посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Выберите один из способов👇
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <button
          onClick={() => onDeliveryMethodChange('courier')}
          className={`p-4 md:p-6 rounded-xl border-2 transition-all ${
            deliveryMethod === 'courier'
              ? 'border-[#0077FE] bg-white'
              : 'border-[#E5E5E5] bg-[#F5F5F5]'
          }`}
        >
          <span className="flex flex-col items-center gap-3 md:gap-4">
            <span className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
              👋
            </span>
            <span className="text-sm md:text-base font-semibold text-[#2D2D2D] text-center">Курьер заберёт посылку</span>
          </span>
        </button>
        <button
          onClick={() => onDeliveryMethodChange('pickup')}
          className={`p-4 md:p-6 rounded-xl border-2 transition-all ${
            deliveryMethod === 'pickup'
              ? 'border-[#0077FE] bg-white'
              : 'border-[#E5E5E5] bg-[#F5F5F5]'
          }`}
        >
          <span className="flex flex-col items-center gap-3 md:gap-4">
            <span className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
              🏫
            </span>
            <span className="text-sm md:text-base font-semibold text-[#2D2D2D] text-center">Сдам в пункте приёма</span>
          </span>
        </button>
      </div>
      {deliveryMethod === 'courier' && (
        <div className="mb-6">
          <SeparatedAddressInput
            street={street}
            house={house}
            apartment={apartment}
            onStreetChange={handleStreetChange}
            onHouseChange={handleHouseChange}
            onApartmentChange={handleApartmentChange}
            label="Адрес"
            city={fromCity}
          />
          {street && !house && (
            <p className="text-yellow-600 text-sm mt-2">Укажите номер дома для более точного адреса</p>
          )}
        </div>
      )}
      {deliveryMethod === 'pickup' && (
        <div className="mb-6 p-3 md:p-4 bg-[#F5F5F5] rounded-xl flex items-start gap-2 md:gap-3">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#0077FE] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <p className="text-xs md:text-sm text-[#2D2D2D]">
            Мы покажем ближайшие пункты приёма без очереди после подтверждения отправки. Нажмите "Продолжить".
          </p>
        </div>
      )}
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

export default DeliveryMethodStep
