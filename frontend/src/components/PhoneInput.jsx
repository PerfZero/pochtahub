import { useRef, useState } from 'react'
import { IMaskInput } from 'react-imask'

function PhoneInput({ value, onChange, label = 'Телефон', required = false, ...props }) {
  const maskRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value && value.length > 0

  const handleAccept = (val, mask) => {
    if (!mask) {
      onChange({ target: { value: val } })
      return
    }
    
    const unmasked = mask.unmaskedValue || ''
    let processedValue = val
    
    if (unmasked.startsWith('8')) {
      const digits = unmasked.substring(1)
      if (digits.length > 0) {
        const formatted = digits.length >= 10 
          ? `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`
          : `+7 (${digits}`
        processedValue = formatted
        if (maskRef.current) {
          setTimeout(() => {
            maskRef.current.value = processedValue
            maskRef.current.updateValue()
          }, 10)
        }
      }
    }
    
    onChange({ target: { value: processedValue } })
  }

  return (
    <div className="relative w-full">
      <IMaskInput
        mask={[
          {
            mask: '+7 (000) 000-00-00'
          },
          {
            mask: '8 (000) 000-00-00'
          }
        ]}
        value={value}
        onAccept={(val, mask) => handleAccept(val, mask)}
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
