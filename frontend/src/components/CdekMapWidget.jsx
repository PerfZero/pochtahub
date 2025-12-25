import { useState, useEffect, useCallback, useRef } from 'react'
import { tariffsAPI } from '../api'

// Сворачиваемый список ПВЗ
function ListAccordion({ options, selectedPoint, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F5] hover:bg-[#EEEEEE] rounded-xl transition-colors"
      >
        <span className="text-sm font-medium text-[#858585]">
          {isOpen ? 'Скрыть список' : 'Показать список ПВЗ'}
        </span>
        <svg 
          className={`w-5 h-5 text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mt-2 max-h-[250px] overflow-auto border border-[#E5E5E5] rounded-xl">
          {options.slice(0, 30).map((option, idx) => (
            <div
              key={option.code || idx}
              onClick={() => onSelect(option)}
              className={`px-4 py-3 cursor-pointer hover:bg-[#F0F7FF] border-b border-[#F5F5F5] last:border-b-0 transition-colors ${
                selectedPoint?.code === option.code ? 'bg-[#F0F7FF]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedPoint?.code === option.code ? 'bg-[#0077FE]' : 'bg-[#F5F5F5]'
                }`}>
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={selectedPoint?.code === option.code ? 'white' : '#858585'} 
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    selectedPoint?.code === option.code ? 'text-[#0077FE]' : 'text-[#2D2D2D]'
                  }`}>
                    {option.name || option.code}
                  </p>
                  <p className="text-xs text-[#858585] mt-0.5 line-clamp-1">
                    {option.address}
                  </p>
                </div>
                {selectedPoint?.code === option.code && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                    <circle cx="10" cy="10" r="10" fill="#0077FE"/>
                    <path d="M14 7L8.5 12.5L6 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CdekMapWidget({ 
  city, 
  cityFrom, 
  onSelect, 
  selectedCode = null,
  tariffCode = 136,
  transportCompanyId = 2
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  // Загрузка API Яндекс Карт
  useEffect(() => {
    const loadYandexMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.ymaps && window.ymaps.ready) {
          window.ymaps.ready(resolve)
          return
        }

        const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]')
        if (existingScript) {
          if (window.ymaps) {
            window.ymaps.ready(resolve)
          } else {
            existingScript.addEventListener('load', () => {
              if (window.ymaps) {
                window.ymaps.ready(resolve)
              }
            })
          }
          return
        }

        const script = document.createElement('script')
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=2437cb1a-7149-473c-bf5b-d9d935c7de05&lang=ru_RU'
        script.async = true
        script.onload = () => {
          if (window.ymaps) {
            window.ymaps.ready(resolve)
          } else {
            reject(new Error('Яндекс Карты не загружены'))
          }
        }
        script.onerror = () => reject(new Error('Ошибка загрузки Яндекс Карт'))
        document.head.appendChild(script)
      })
    }

    loadYandexMaps()
      .then(() => {
        setMapReady(true)
        setMapLoading(false)
      })
      .catch((err) => {
        console.error('Ошибка загрузки Яндекс Карт:', err)
        setMapLoading(false)
      })
  }, [])

  // Загрузка ПВЗ
  const loadDeliveryPoints = useCallback(async () => {
    if (!city) {
      setOptions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await tariffsAPI.getDeliveryPoints({
        city: city,
        transport_company_id: transportCompanyId,
        size: 100
      })
      
      const points = response.data?.points || []
      
      const formattedOptions = points
        .filter(point => point.code || point.uuid)
        .map((point) => {
          const location = point.location || {}
          return {
            value: point.code || point.uuid,
            code: point.code,
            name: point.name || '',
            address: location.address || point.address || '',
            fullAddress: `${location.city || city}, ${location.address || point.address || ''}`,
            workTime: point.work_time_list?.[0]?.time || point.work_time || '',
            phone: point.phones?.[0]?.number || '',
            lat: location.latitude,
            lng: location.longitude,
            fullData: point
          }
        })

      setOptions(formattedOptions)
      
      if (formattedOptions.length === 0) {
        setError('ПВЗ в этом городе не найдены')
      }
    } catch (err) {
      console.error('Ошибка загрузки ПВЗ:', err)
      setError('Не удалось загрузить список ПВЗ')
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [city, transportCompanyId])

  useEffect(() => {
    loadDeliveryPoints()
  }, [loadDeliveryPoints])

  // Инициализация карты
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || options.length === 0) return

    const ymaps = window.ymaps
    if (!ymaps) return

    // Находим центр карты
    const pointsWithCoords = options.filter(p => p.lat && p.lng)
    if (pointsWithCoords.length === 0) return

    const centerLat = pointsWithCoords.reduce((sum, p) => sum + p.lat, 0) / pointsWithCoords.length
    const centerLng = pointsWithCoords.reduce((sum, p) => sum + p.lng, 0) / pointsWithCoords.length

    // Очищаем предыдущую карту
    if (mapRef.current) {
      mapRef.current.destroy()
    }

    // Создаём карту
    const map = new ymaps.Map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl']
    })

    mapRef.current = map

    // Создаём кластеризатор
    const clusterer = new ymaps.Clusterer({
      preset: 'islands#blueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false
    })

    // Добавляем метки
    const placemarks = pointsWithCoords.map((point) => {
      const isSelected = selectedPoint?.code === point.code

      const placemark = new ymaps.Placemark(
        [point.lat, point.lng],
        {
          balloonContentHeader: `<strong>${point.name || 'ПВЗ СДЭК'}</strong>`,
          balloonContentBody: `
            <div style="max-width: 250px;">
              <p style="margin: 5px 0; color: #666;">${point.address}</p>
              ${point.workTime ? `<p style="margin: 5px 0; font-size: 12px; color: #888;">🕐 ${point.workTime}</p>` : ''}
              ${point.phone ? `<p style="margin: 5px 0; font-size: 12px; color: #888;">📞 ${point.phone}</p>` : ''}
              <button 
                onclick="window.selectCdekPoint('${point.code}')"
                style="margin-top: 10px; padding: 8px 16px; background: #0077FE; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;"
              >
                Выбрать этот ПВЗ
              </button>
            </div>
          `,
          hintContent: point.name || point.address,
          pointData: point
        },
        {
          preset: isSelected ? 'islands#blueDotIcon' : 'islands#blueCircleDotIcon',
          iconColor: '#0077FE'
        }
      )

      placemark.events.add('click', () => {
        // Показываем балун при клике
      })

      return placemark
    })

    clusterer.add(placemarks)
    map.geoObjects.add(clusterer)

    // Подгоняем границы карты
    map.setBounds(clusterer.getBounds(), {
      checkZoomRange: true,
      zoomMargin: 50
    })

    // Глобальная функция для выбора ПВЗ из балуна
    window.selectCdekPoint = (code) => {
      const point = options.find(p => p.code === code)
      if (point) {
        setSelectedPoint(point)
        if (onSelect) {
          onSelect({
            id: point.value,
            code: point.code,
            name: point.name,
            address: point.fullAddress,
            workTime: point.workTime,
            phone: point.phone
          })
        }
        map.balloon.close()
      }
    }

    return () => {
      delete window.selectCdekPoint
    }
  }, [mapReady, options, selectedPoint, onSelect])

  // Восстанавливаем выбранный ПВЗ
  useEffect(() => {
    if (selectedCode && options.length > 0 && !selectedPoint) {
      const selected = options.find(opt => opt.code === selectedCode || opt.value === selectedCode)
      if (selected) {
        setSelectedPoint(selected)
      }
    }
  }, [selectedCode, options, selectedPoint])

  const handleListSelect = (option) => {
    setSelectedPoint(option)
    
    // Центрируем карту на выбранной точке
    if (mapRef.current && option.lat && option.lng) {
      mapRef.current.setCenter([option.lat, option.lng], 15, { duration: 300 })
    }
    
    if (onSelect) {
      onSelect({
        id: option.value,
        code: option.code,
        name: option.name,
        address: option.fullAddress,
        workTime: option.workTime,
        phone: option.phone
      })
    }
  }

  const isLoading = loading || mapLoading

  return (
    <div className="cdek-pvz-selector">
      {/* Заголовок */}
      <div className="mb-4 p-4 bg-[#0077FE] rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0077FE" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-white">Пункты выдачи СДЭК</p>
            <p className="text-sm text-white/80">
              {isLoading ? 'Загрузка...' : `${options.length} ПВЗ в г. ${city}`}
            </p>
          </div>
        </div>
      </div>

      {error && !isLoading && options.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={loadDeliveryPoints}
            className="mt-2 text-sm text-[#0077FE] hover:underline"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Карта */}
      <div className="mb-4 rounded-xl overflow-hidden border border-[#E5E5E5]">
        {isLoading ? (
          <div className="h-[350px] bg-[#F9F9F9] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#0077FE] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#858585]">Загрузка карты...</p>
            </div>
          </div>
        ) : (
          <div 
            ref={mapContainerRef} 
            className="h-[350px] w-full"
            style={{ background: '#f0f0f0' }}
          />
        )}
      </div>

      {/* Сворачиваемый список ПВЗ */}
      {!isLoading && options.length > 0 && (
        <ListAccordion 
          options={options} 
          selectedPoint={selectedPoint} 
          onSelect={handleListSelect} 
        />
      )}

      {/* Карточка выбранного ПВЗ */}
      {selectedPoint && (
        <div className="p-4 bg-[#F0F7FF] border-2 border-[#0077FE] rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0077FE] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2D2D2D] mb-1">
                {selectedPoint.name || 'ПВЗ выбран'}
              </p>
              <p className="text-sm text-[#858585]">{selectedPoint.fullAddress || selectedPoint.address}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {selectedPoint.workTime && (
                  <span className="text-xs text-[#858585]">🕐 {selectedPoint.workTime}</span>
                )}
                {selectedPoint.phone && (
                  <span className="text-xs text-[#858585]">📞 {selectedPoint.phone}</span>
                )}
              </div>
              <p className="text-xs text-[#0077FE] mt-2 font-medium">Код ПВЗ: {selectedPoint.code}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CdekMapWidget
