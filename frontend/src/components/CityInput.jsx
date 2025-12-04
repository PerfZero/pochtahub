import { useState, useCallback, useRef, useEffect } from 'react'
import axios from 'axios'

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || ''

function CityInput({ value = '', onChange, placeholder = 'Откуда' }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const hasValue = value && value.length > 0
  const isFloating = isFocused || hasValue

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2 || !DADATA_TOKEN) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        DADATA_API_URL,
        { 
          query, 
          count: 10,
          from_bound: { value: 'city' },
          to_bound: { value: 'city' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${DADATA_TOKEN}`,
          },
        }
      )

      const suggestions = response.data.suggestions.map((item) => ({
        value: item.data.city || item.value,
        label: item.data.city || item.value,
      }))

      setOptions(suggestions)
      setIsOpen(suggestions.length > 0)
    } catch (error) {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange({ target: { value: val } })
    loadSuggestions(val)
  }

  const handleSelect = (option) => {
    onChange({ target: { value: option.value } })
    setIsOpen(false)
    setOptions([])
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (options.length > 0) setIsOpen(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className="relative cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <label 
          className={`absolute left-0 transition-all duration-200 pointer-events-none ${
            isFloating 
              ? 'top-0 text-xs text-[#858585] font-semibold' 
              : 'top-1/2 -translate-y-1/2 text-base text-[#C8C7CC] font-semibold'
          }`}
        >
          {placeholder}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full bg-transparent outline-none text-sm font-semibold text-[#2D2D2D] ${
            isFloating ? 'pt-4 pb-1' : 'py-2'
          }`}
        />
      </div>
      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C7CC] rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
          {options.map((option, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 text-sm text-[#2D2D2D] cursor-pointer hover:bg-[#F4EEE2]"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CityInput
