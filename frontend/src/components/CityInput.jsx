import { useState, useCallback } from 'react'
import Select from 'react-select'
import axios from 'axios'

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const DADATA_GEOLOCATE_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address'
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || ''

function CityInput({ value = '', onChange, placeholder = 'Начните вводить город...' }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)

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
    } catch (error) {
      console.error('Ошибка загрузки городов:', error)
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
    } else {
      onChange({ target: { value: '' } })
    }
  }

  const detectCityByLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером')
      return
    }

    if (!DADATA_TOKEN) {
      alert('Для определения города необходим токен DaData')
      return
    }

    setDetecting(true)
    console.log('Начало определения города через геолокацию...')
    try {
      console.log('Запрос геолокации...')
      const position = await new Promise((resolve, reject) => {
        let watchId = null
        let timeoutId = null
        
        const cleanup = () => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId)
          }
          if (timeoutId !== null) {
            clearTimeout(timeoutId)
          }
        }
        
        timeoutId = setTimeout(() => {
          cleanup()
          reject({ code: 3, message: 'Превышено время ожидания' })
        }, 15000)
        
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            console.log('Геолокация получена:', pos.coords)
            cleanup()
            resolve(pos)
          },
          (error) => {
            console.error('Ошибка геолокации:', error.code, error.message)
            cleanup()
            if (error.code === 1) {
              reject({ code: 1, message: 'Доступ к геолокации запрещен' })
            } else if (error.code === 2) {
              reject({ code: 2, message: 'Не удалось определить местоположение. Попробуйте открыть сайт через HTTPS или использовать другой браузер' })
            } else if (error.code === 3) {
              reject({ code: 3, message: 'Превышено время ожидания' })
            } else {
              reject({ code: error.code || 0, message: error.message || 'Неизвестная ошибка геолокации' })
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 0
          }
        )
      })

      const { latitude, longitude } = position.coords

      if (!latitude || !longitude) {
        throw new Error('Координаты не получены')
      }

      console.log('Получены координаты:', latitude, longitude)

      const response = await axios.post(
        DADATA_GEOLOCATE_URL,
        {
          lat: latitude,
          lon: longitude,
          count: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${DADATA_TOKEN}`,
          },
        }
      )

      console.log('DaData ответ:', response.data)

      if (response.data.suggestions && response.data.suggestions.length > 0) {
        const city = response.data.suggestions[0].data.city || 
                     response.data.suggestions[0].data.settlement ||
                     response.data.suggestions[0].data.region_with_type?.replace(/\s*область\s*/i, '').replace(/\s*край\s*/i, '').trim()
        if (city) {
          onChange({ target: { value: city } })
        } else {
          console.error('DaData ответ не содержит город:', response.data)
          alert('Не удалось определить город по вашим координатам')
        }
      } else {
        console.error('DaData вернул пустой ответ:', response.data)
        alert('Не удалось определить город по вашим координатам')
      }
    } catch (error) {
      if (error.code === 1) {
        alert('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера')
      } else if (error.code === 2) {
        alert('Не удалось определить ваше местоположение. Убедитесь, что GPS включен и есть доступ к интернету')
      } else if (error.code === 3) {
        alert('Превышено время ожидания определения местоположения')
      } else if (error.response) {
        console.error('Ошибка DaData API:', error.response.status, error.response.data)
        alert(`Ошибка DaData API (${error.response.status}): ${error.response.data?.detail || error.response.data?.message || 'Неизвестная ошибка'}`)
      } else {
        console.error('Ошибка определения города:', error)
        const errorMessage = error.message || 'Не удалось определить местоположение. Попробуйте еще раз или введите город вручную'
        alert(errorMessage)
      }
    } finally {
      setDetecting(false)
    }
  }, [onChange])

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
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <Select
          value={value ? { value, label: value } : null}
          onInputChange={handleInputChange}
          onChange={handleChange}
          options={options}
          placeholder={placeholder}
          isLoading={loading}
          isClearable
          isSearchable
          noOptionsMessage={() => 'Начните вводить город (минимум 2 символа)'}
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '38px',
              border: '1px solid #ddd',
            }),
          }}
        />
      </div>
      <button
        type="button"
        onClick={detectCityByLocation}
        disabled={detecting}
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: detecting ? 'wait' : 'pointer',
          fontSize: '14px',
          whiteSpace: 'nowrap'
        }}
        title="Определить город по местоположению"
      >
        {detecting ? '...' : '📍'}
      </button>
    </div>
  )
}

export default CityInput
