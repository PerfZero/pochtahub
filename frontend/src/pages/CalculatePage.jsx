import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tariffsAPI } from '../api'
import './CalculatePage.css'

function CalculatePage() {
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [weight, setWeight] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCalculate = async (e) => {
    e.preventDefault()
    if (!fromAddress || !toAddress || !weight) {
      alert('Заполните все поля')
      return
    }
    setLoading(true)
    setOptions([])
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const extractCity = (address) => {
        if (!address) return ''
        const parts = address.split(',')
        return parts[0].trim()
      }
      
      const response = await tariffsAPI.calculate({
        weight: parseFloat(weight),
        from_city: extractCity(fromAddress),
        to_city: extractCity(toAddress),
        from_address: fromAddress,
        to_address: toAddress,
      })
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
        fromAddress,
        toAddress,
      },
    })
  }

  const handleNewCalculation = () => {
    setOptions([])
    setFromAddress('')
    setToAddress('')
    setWeight('')
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
                  <div className="address-fields">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="От куда"
                        value={fromAddress}
                        onChange={(e) => setFromAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Куда"
                        value={toAddress}
                        onChange={(e) => setToAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="weight-field">
                    <label>Вес (кг) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
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
                  <div className="price">{option.price} ₽</div>
                  <div className="delivery-time">5 дня</div>
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

