import { useState, useCallback, useRef, useEffect } from 'react'
import axios from 'axios'

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || ''

function CityInput({ value = '', onChange, label = 'Город', required = false, variant = 'default' }) {
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
          count: 20,
          from_bound: { value: "city" },
          to_bound: { value: "settlement" }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${DADATA_TOKEN}`,
          },
        }
      )

      const suggestions = response.data.suggestions
        .filter((item) => {
          const data = item.data
          return (data.city || data.settlement) && !data.street && !data.house
        })
        .map((item) => {
          const city = item.data.city_with_type || item.data.city || item.data.settlement_with_type || item.data.settlement || ''
          return {
            value: city,
            label: city,
            id: item.data.fias_id || item.value || city
          }
        })
        .filter((item, index, self) => 
          index === self.findIndex((t) => t.value === item.value)
        )
        .slice(0, 10)

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

  if (variant === 'hero') {
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
            {label}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full bg-transparent outline-none text-sm font-semibold text-[#2D2D2D] truncate ${
              isFloating ? 'pt-4 pb-1' : 'py-2'
            }`}
          />
        </div>
        {isOpen && options.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className="px-4 py-3 text-sm text-[#2D2D2D] cursor-pointer hover:bg-[#F4EEE2] first:rounded-t-xl last:rounded-b-xl"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=" "
          className="peer w-full px-4 pt-6 pb-2 border-0 rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
        />
        <label className={`absolute left-4 bold  transition-all duration-200 pointer-events-none ${
          isFloating
            ? 'top-3 text-xs'
            : 'top-1/2 -translate-y-1/2 text-base'
        } ${isFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
          {label}{required ? ' *' : ''}
        </label>
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#C8C7CC] border-t-[#0077FE] rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C7CC] rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className="px-4 py-3 text-sm text-[#2D2D2D] cursor-pointer hover:bg-[#F4EEE2] first:rounded-t-xl last:rounded-b-xl"
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
