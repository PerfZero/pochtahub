import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ordersAPI } from '../api'
import PhoneInput from '../components/PhoneInput'
import AddressInput from '../components/AddressInput'
import CityInput from '../components/CityInput'
import DeliveryPointInput from '../components/DeliveryPointInput'
import './OrderPage.css'

function OrderPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const orderData = location.state?.orderData || location.state || {}
  const [company, setCompany] = useState(orderData.company || null)
  const [weight, setWeight] = useState(orderData.weight || '')
  const [fromAddress, setFromAddress] = useState(orderData.fromAddress || '')
  const [toAddress, setToAddress] = useState(orderData.toAddress || '')
  const [fromCity, setFromCity] = useState(orderData.fromCity || '')
  const [toCity, setToCity] = useState(orderData.toCity || '')
  
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderAddress, setSenderAddress] = useState(fromAddress)
  const [senderCity, setSenderCity] = useState(fromCity)
  
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState(toAddress)
  const [recipientCity, setRecipientCity] = useState(toCity)
  const [recipientDeliveryPointCode, setRecipientDeliveryPointCode] = useState('')
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { 
        state: { 
          returnTo: '/order', 
          orderData: { company, weight, fromAddress, toAddress, fromCity, toCity } 
        } 
      })
      return
    }
    
    if (!company) {
      navigate('/calculate')
      return
    }
  }, [company, weight, fromAddress, toAddress, fromCity, toCity, navigate])

  useEffect(() => {
    if (fromAddress) {
      setSenderAddress(fromAddress)
    }
    if (toAddress) {
      setRecipientAddress(toAddress)
    }
    if (fromCity) {
      setSenderCity(fromCity)
    }
    if (toCity) {
      setRecipientCity(toCity)
    }
  }, [fromAddress, toAddress, fromCity, toCity])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const orderData = {
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_address: senderAddress,
        sender_city: senderCity,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        recipient_city: recipientCity,
        recipient_delivery_point_code: recipientDeliveryPointCode || null,
        weight: parseFloat(weight),
        transport_company_id: company.company_id,
        transport_company_name: company.company_name,
        price: company.price,
        tariff_code: company.tariff_code,
        tariff_name: company.tariff_name,
      }
      console.log('Order data before submit:', orderData)
      console.log('Recipient delivery point code:', recipientDeliveryPointCode)
      const response = await ordersAPI.createOrder(orderData)
      console.log('Order created response:', response)
      console.log('Order data:', response.data)
      
      const orderId = response.data?.id || response.data?.pk
      console.log('Order ID:', orderId)
      
      if (orderId) {
        navigate(`/confirmation/${orderId}`)
      } else {
        console.error('ID заказа не найден в ответе:', response.data)
        alert('Ошибка: ID заказа не получен')
        setLoading(false)
      }
    } catch (error) {
      console.error('Ошибка создания заказа:', error)
      console.error('Error response:', error.response?.data)
      alert(`Ошибка создания заказа: ${error.response?.data?.detail || error.message}`)
      setLoading(false)
    }
  }

  if (!company) {
    return null
  }

  return (
    <div className="order-page">
      <h1>Оформление заказа</h1>
      <div className="order-summary">
        <h3>Выбранная ТК: {company.company_name}</h3>
        {company.tariff_name && <p>Тариф: {company.tariff_name}</p>}
        <p>Стоимость: {company.price} ₽</p>
        <p>Вес: {weight} кг</p>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h2>Данные отправителя</h2>
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Телефон *</label>
            <PhoneInput
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Город *</label>
            <CityInput
              value={senderCity}
              onChange={(e) => setSenderCity(e.target.value)}
              placeholder="Начните вводить город..."
            />
          </div>
          <div className="form-group">
            <label>Адрес *</label>
            <AddressInput
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              onCityChange={(e) => setSenderCity(e.target.value)}
              placeholder="Начните вводить адрес..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Данные получателя</h2>
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Телефон *</label>
            <PhoneInput
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Город *</label>
            <CityInput
              value={recipientCity}
              onChange={(e) => setRecipientCity(e.target.value)}
              placeholder="Начните вводить город..."
            />
          </div>
          <div className="form-group">
            <label>Адрес *</label>
            <AddressInput
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              onCityChange={(e) => setRecipientCity(e.target.value)}
              placeholder="Начните вводить адрес..."
            />
          </div>
          {company?.company_code === 'cdek' && (
            <div className="form-group">
              <label>ПВЗ (Пункт выдачи заказов)</label>
              <DeliveryPointInput
                city={recipientCity}
                transportCompanyId={company.company_id}
                value={recipientDeliveryPointCode}
                onChange={(e) => {
                  const value = e?.target?.value || e?.value || '';
                  setRecipientDeliveryPointCode(value);
                }}
                placeholder="Выберите ПВЗ (опционально)"
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Выберите пункт выдачи, если доставка осуществляется в ПВЗ
              </small>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Создание заказа...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  )
}

export default OrderPage

