import { useState, useEffect, useCallback, useRef } from 'react'
import { tariffsAPI } from '../api'

function DeliveryPointInput({ city, transportCompanyId, value, onChange, label = 'ПВЗ' }) {
  const [options, setOptions] = useState([])
  const [filteredOptions, setFilteredOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const hasValue = selectedLabel || searchValue
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

  const loadDeliveryPoints = useCallback(async () => {
    if (!city || !transportCompanyId) {
      setOptions([])
      setFilteredOptions([])
      return
    }

    setLoading(true)
    try {
      const response = await tariffsAPI.getDeliveryPoints({
        city: city,
        transport_company_id: transportCompanyId,
        size: 50
      })
      
      const points = response.data?.points || []
      const activePoints = points.filter(point => {
        if (point.work_time && Array.isArray(point.work_time) && point.work_time.length > 0) {
          return true
        }
        if (point.work_time_list && Array.isArray(point.work_time_list) && point.work_time_list.length > 0) {
          return true
        }
        return point.code || point.uuid
      })
      const formattedOptions = activePoints.map((point) => ({
        value: point.code || point.uuid,
        label: `${point.name || point.code || ''} - ${point.location?.address || point.address || ''}`,
        code: point.code,
        uuid: point.uuid,
        fullData: point
      }))

      setOptions(formattedOptions)
      setFilteredOptions(formattedOptions)
    } catch (error) {
      setOptions([])
      setFilteredOptions([])
    } finally {
      setLoading(false)
    }
  }, [city, transportCompanyId])

  useEffect(() => {
    if (city && transportCompanyId) {
      loadDeliveryPoints()
    }
  }, [city, transportCompanyId, loadDeliveryPoints])

  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find(opt => opt.value === value)
      if (selected) {
        setSelectedLabel(selected.label)
      }
    } else {
      setSelectedLabel('')
    }
  }, [value, options])

  const handleInputChange = (e) => {
    const val = e.target.value
    setSearchValue(val)
    setSelectedLabel('')
    
    if (val) {
      const filtered = options.filter(opt => 
        opt.label.toLowerCase().includes(val.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
    setIsOpen(true)
  }

  const handleSelect = (option) => {
    setSelectedLabel(option.label)
    setSearchValue('')
    onChange({ target: { value: option.value }, value: option.value })
    setIsOpen(false)
  }

  const handleFocus = () => {
    setIsFocused(true)
    setIsOpen(true)
    setFilteredOptions(options)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  if (!city || !transportCompanyId) {
    return (
      <div className="relative w-full">
        <input
          type="text"
          value=""
          disabled
          placeholder=" "
          className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#858585] bg-[#F9F9F9] cursor-not-allowed"
        />
        <label className="absolute left-4 top-3 text-xs text-[#858585] pointer-events-none">
          {label}
        </label>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedLabel || searchValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=" "
          className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
        />
        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFloating
            ? 'top-3 text-xs'
            : 'top-1/2 -translate-y-1/2 text-base'
        } ${isFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
          {label}
        </label>
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#C8C7CC] border-t-[#0077FE] rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C7CC] rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-[#858585]">Загрузка...</div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(option)}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#F4EEE2] first:rounded-t-xl last:rounded-b-xl ${
                  option.value === value ? 'bg-[#F4EEE2] text-[#0077FE]' : 'text-[#2D2D2D]'
                }`}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-[#858585]">ПВЗ не найдены</div>
          )}
        </div>
      )}
    </div>
  )
}

export default DeliveryPointInput
