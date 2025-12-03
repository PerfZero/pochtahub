import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tariffsAPI } from '../api'
import CityInput from '../components/CityInput'
import './CalculatePage.css'

function CalculatePage() {
  const [fromCity, setFromCity] = useState('')
  const [toCity, setToCity] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!image) {
      alert('Загрузите фотографию')
      return
    }
    
    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      
      const response = await tariffsAPI.analyzeImage(formData)
      const data = response.data
      
      if (data.warning) {
        alert(data.warning)
      }
      
      if (data.weight > 0) setWeight(data.weight.toString())
      if (data.length > 0) setLength(data.length.toString())
      if (data.width > 0) setWidth(data.width.toString())
      if (data.height > 0) setHeight(data.height.toString())
    } catch (error) {
      console.error('Ошибка анализа изображения:', error)
      alert(`Ошибка анализа изображения: ${error.response?.data?.error || error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCalculate = async (e) => {
    e.preventDefault()
    if (!fromCity || !toCity || !weight) {
      alert('Заполните все поля')
      return
    }
    setLoading(true)
    setOptions([])
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const calculateData = {
        weight: parseFloat(weight),
        from_city: fromCity,
        to_city: toCity,
        from_address: fromCity,
        to_address: toCity,
      }
      
      if (length) calculateData.length = parseFloat(length)
      if (width) calculateData.width = parseFloat(width)
      if (height) calculateData.height = parseFloat(height)
      
      const response = await tariffsAPI.calculate(calculateData)
      console.log('Full response:', response)
      console.log('Response data:', response.data)
      console.log('Options:', response.data?.options)
      
      const optionsData = response.data?.options || []
      console.log('Options array:', optionsData, 'Length:', optionsData.length)
      
      if (optionsData.length > 0) {
        setOptions(optionsData)
        console.log('Options set:', optionsData)
      } else {
        console.warn('Нет доступных вариантов доставки')
        alert('Нет доступных вариантов доставки для указанного веса')
        setLoading(false)
      }
    } catch (error) {
      console.error('Ошибка расчета:', error)
      console.error('Error response:', error.response?.data)
      alert(`Ошибка расчета стоимости: ${error.response?.data?.detail || error.message}`)
      setLoading(false)
    }
  }

  const handleSelectCompany = (company) => {
    navigate('/order', {
      state: {
        company,
        weight: parseFloat(weight),
        fromAddress: fromCity,
        toAddress: toCity,
        fromCity: fromCity,
        toCity: toCity,
      },
    })
  }

  const handleNewCalculation = () => {
    setOptions([])
    setFromCity('')
    setToCity('')
    setWeight('')
    setLength('')
    setWidth('')
    setHeight('')
    setImage(null)
    setImagePreview(null)
  }

  return (
    <div className="calculate-page">
      <div className="calculate-header">
        <div className="logo">Pochta Hub</div>
        <div className="subtitle">Агрегатор транспортных компаний</div>
      </div>
      
      {options.length === 0 ? (
        <>
          {loading ? (
            <div className="loading-container">
              <div className="loader"></div>
              <p className="loading-text">Рассчитываем стоимость доставки...</p>
            </div>
          ) : (
            <div className="calculate-content">
              <div className="left-section">
                <h1>СФОТКАЙ ПОСЫЛКУ</h1>
                <p className="sub-headline">получи расчёт доставки</p>
                
                <ul className="features">
                  <li>Без регистрации</li>
                  <li>Без замеров</li>
                  <li>Просто фото</li>
                </ul>

                <form onSubmit={handleCalculate} className="calculate-form">
                  <div className="image-upload-section">
                    <label className="image-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <div className="image-upload-area">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="image-preview" />
                        ) : (
                          <div className="image-upload-placeholder">
                            <span>📷</span>
                            <span>Загрузить фото посылки</span>
                          </div>
                        )}
                      </div>
                    </label>
                    {image && (
                      <button
                        type="button"
                        onClick={handleAnalyzeImage}
                        disabled={analyzing}
                        className="analyze-button"
                      >
                        {analyzing ? 'Анализирую...' : 'Определить параметры'}
                      </button>
                    )}
                  </div>

                  <div className="address-fields">
                    <div className="form-group">
                      <CityInput
                        placeholder="От куда"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <CityInput
                        placeholder="Куда"
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="dimensions-fields">
                    <div className="dimension-field">
                      <label>Вес (кг) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                    </div>
                    <div className="dimension-field">
                      <label>Длина (см)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </div>
                    <div className="dimension-field">
                      <label>Ширина (см)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>
                    <div className="dimension-field">
                      <label>Высота (см)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="calculate-button">
                    Рассчитать
                  </button>
                </form>
              </div>
              <div className="right-section"></div>
            </div>
          )}
        </>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <h2>Варианты доставки</h2>
            <button onClick={handleNewCalculation} className="new-calculation-button">
              Новый расчет
            </button>
          </div>
          <div className="options-grid">
            {options.map((option, index) => (
              <div key={option.company_id} className="option-card">
                {index === 0 && <span className="badge cheapest">Самый дешевый</span>}
                <div className="company-info">
                  <h3>{option.company_name}</h3>
                  {option.tariff_name && <p className="tariff-name">{option.tariff_name}</p>}
                  <div className="price">{option.price} ₽</div>
                  {option.delivery_time && <div className="delivery-time">{option.delivery_time} дн.</div>}
                </div>
                <button 
                  onClick={() => handleSelectCompany(option)}
                  className="order-button"
                >
                  ОФОРМИТЬ ОТПРАВКУ
                </button>
                <p className="description">
                  Мы подготовим отправление. Вы просто сдаете его в ближайшем ПВЗ без очереди
                </p>
                <div className="links">
                  <a href="#">Перейти на сайт</a>
                  <a href="#">Сдать рядом</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalculatePage

