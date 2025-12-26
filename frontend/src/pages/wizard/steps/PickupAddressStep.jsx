import { useState } from 'react'
import AddressInput from '../../../components/AddressInput'

function PickupAddressStep({ pickupAddress, onPickupAddressChange, pickupSenderName, onPickupSenderNameChange, fromCity, onContinue }) {
  const [pickupSenderNameFocused, setPickupSenderNameFocused] = useState(false)

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Где забрать посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Осталось указать адрес, откуда забрать посылку, и имя отправителя — чтобы мы могли оформить забор.
      </p>
      
      <div className="mb-6">
        <AddressInput
          value={pickupAddress}
          onChange={onPickupAddressChange}
          label="Адрес забора"
          required
          city={fromCity}
        />
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className={`relative border rounded-xl ${
            pickupSenderNameFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
          }`}>
            <input
              type="text"
              value={pickupSenderName}
              onChange={onPickupSenderNameChange}
              onFocus={() => setPickupSenderNameFocused(true)}
              onBlur={() => setPickupSenderNameFocused(false)}
              placeholder=" "
              className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
            />
            <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              pickupSenderName || pickupSenderNameFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
            } ${pickupSenderNameFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
              Имя отправителя *
            </label>
          </div>
        </div>
      </div>

      <button 
        onClick={onContinue}
        disabled={!pickupAddress || !pickupSenderName}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  )
}

export default PickupAddressStep


