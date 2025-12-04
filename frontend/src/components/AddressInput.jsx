import { useState, useCallback, useEffect } from 'react'
import Select from 'react-select'
import axios from 'axios'

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || ''

function AddressInput({ value = '', onChange, onCityChange, placeholder = 'Начните вводить адрес...' }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [showManualInput, setShowManualInput] = useState(false)

  const loadSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3 || !DADATA_TOKEN) {
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
          locations: [],
          restrict_value: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${DADATA_TOKEN}`,
          },
        }
      )

      const suggestions = response.data.suggestions.map((item) => ({
        value: item.value,
        label: item.value,
        city: item.data.city || item.data.settlement || '',
      }))

      setOptions(suggestions)
    } catch (error) {
      console.error('Ошибка загрузки адресов:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (newValue) => {
    setInputValue(newValue)
    if (newValue && newValue.length >= 3) {
      loadSuggestions(newValue)
      setShowManualInput(false)
    } else {
      setOptions([])
      setShowManualInput(false)
    }
  }

  const handleChange = (option) => {
    if (option) {
      onChange({ target: { value: option.value } })
      setInputValue(option.value)
      if (onCityChange && option.city) {
        onCityChange({ target: { value: option.city } })
      }
      setShowManualInput(false)
    } else {
      onChange({ target: { value: '' } })
      setInputValue('')
      setShowManualInput(false)
    }
  }

  const handleManualInput = () => {
    if (inputValue && inputValue.length >= 3) {
      onChange({ target: { value: inputValue } })
      setShowManualInput(false)
    }
  }

  if (!DADATA_TOKEN) {
    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    )
  }

  const hasNoOptions = !loading && inputValue && inputValue.length >= 3 && options.length === 0 && inputValue !== value

  return (
    <div>
      <Select
        value={value ? { value, label: value } : null}
        onInputChange={handleInputChange}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isLoading={loading}
        isClearable
        isSearchable
        noOptionsMessage={() => {
          if (inputValue && inputValue.length >= 3) {
            return `Адрес не найден`
          }
          return 'Начните вводить адрес (минимум 3 символа)'
        }}
      />
      {hasNoOptions && (
        <div>
          <button type="button" onClick={handleManualInput}>
            Использовать "{inputValue}"
          </button>
        </div>
      )}
    </div>
  )
}

export default AddressInput
