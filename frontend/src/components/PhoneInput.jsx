import { useRef, useState } from 'react'
import { IMaskInput } from 'react-imask'

function PhoneInput({ value, onChange, label = 'Телефон', required = false, ...props }) {
  const maskRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <div className="relative w-full">
      <IMaskInput
        mask="+7 (000) 000-00-00"
        value={value}
        onAccept={(val) => onChange({ target: { value: val } })}
        inputRef={maskRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=" "
        className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
        {...props}
      />
      <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
        isFocused || hasValue
          ? 'top-3 text-xs'
          : 'top-1/2 -translate-y-1/2 text-base'
      } ${isFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
        {label}{required ? ' *' : ''}
      </label>
    </div>
  )
}

export default PhoneInput
