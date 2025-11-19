import { useState, useCallback } from 'react'
import Select from 'react-select'
import axios from 'axios'

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || ''

function AddressInput({ value = '', onChange, onCityChange, placeholder = 'Начните вводить адрес...' }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  const loadSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3 || !DADATA_TOKEN) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        DADATA_API_URL,
        { query, count: 5 },
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

  const handleInputChange = (newValue) => {
    loadSuggestions(newValue)
  }

  const handleChange = (option) => {
    if (option) {
      onChange({ target: { value: option.value } })
      if (onCityChange && option.city) {
        onCityChange({ target: { value: option.city } })
      }
    } else {
      onChange({ target: { value: '' } })
    }
  }

  if (!DADATA_TOKEN) {
    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
    )
  }

  return (
    <Select
      value={value ? { value, label: value } : null}
      onInputChange={handleInputChange}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isLoading={loading}
      isClearable
      isSearchable
      noOptionsMessage={() => 'Начните вводить адрес (минимум 3 символа)'}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '38px',
          border: '1px solid #ddd',
        }),
      }}
    />
  )
}

export default AddressInput
