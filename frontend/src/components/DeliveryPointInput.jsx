import { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import { tariffsAPI } from '../api'

function DeliveryPointInput({ city, transportCompanyId, value, onChange, placeholder = 'Выберите ПВЗ...' }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  const loadDeliveryPoints = useCallback(async () => {
    if (!city || !transportCompanyId) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const response = await tariffsAPI.getDeliveryPoints({
        city: city,
        transport_company_id: transportCompanyId,
        size: 20
      })
      
      const points = response.data?.points || []
      const activePoints = points.filter(point => 
        point.work_time && point.work_time.length > 0
      )
      const formattedOptions = activePoints.map((point) => ({
        value: point.code || point.uuid,
        label: `${point.name || point.code || ''} - ${point.location?.address || point.address || ''}`,
        code: point.code,
        uuid: point.uuid,
        fullData: point
      }))

      setOptions(formattedOptions)
    } catch (error) {
      console.error('Ошибка загрузки ПВЗ:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [city, transportCompanyId])

  useEffect(() => {
    if (city && transportCompanyId) {
      loadDeliveryPoints()
    }
  }, [city, transportCompanyId, loadDeliveryPoints])

  const handleChange = (option) => {
    if (option) {
      onChange({ target: { value: option.value }, value: option.value })
    } else {
      onChange({ target: { value: '' }, value: '' })
    }
  }

  if (!city || !transportCompanyId) {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        placeholder="Сначала выберите город"
        disabled
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          backgroundColor: '#f5f5f5',
        }}
      />
    )
  }

  return (
    <Select
      value={value ? options.find(opt => opt.value === value) : null}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isLoading={loading}
      isClearable
      isSearchable
      noOptionsMessage={() => loading ? 'Загрузка...' : 'ПВЗ не найдены'}
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

export default DeliveryPointInput

