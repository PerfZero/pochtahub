import { useState, useRef } from 'react'

function NumberInput({ value = '', onChange, label, className = '' }) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const hasValue = value && value.length > 0
  const isFloating = isFocused || hasValue

  return (
    <div className={`relative ${className}`}>
      <div className={`relative border rounded-xl ${
        isFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
      }`}>
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=" "
          className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFloating ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
        } ${isFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
          {label}
        </label>
      </div>
    </div>
  )
}

export default NumberInput










