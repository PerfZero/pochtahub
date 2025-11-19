import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ordersAPI } from '../api'
import PhoneInput from '../components/PhoneInput'
import AddressInput from '../components/AddressInput'
import CityInput from '../components/CityInput'
import './OrderPage.css'

function OrderPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const orderData = location.state?.orderData || location.state || {}
  const [company, setCompany] = useState(orderData.company || null)
  const [weight, setWeight] = useState(orderData.weight || '')
  const [fromAddress, setFromAddress] = useState(orderData.fromAddress || '')
  const [toAddress, setToAddress] = useState(orderData.toAddress || '')
  
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderAddress, setSenderAddress] = useState(fromAddress)
  const [senderCity, setSenderCity] = useState('')
  
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState(toAddress)
  const [recipientCity, setRecipientCity] = useState('')
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!company) {
      navigate('/calculate')
      return
    }
    
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { 
        state: { 
          returnTo: '/order', 
          orderData: { company, weight, fromAddress, toAddress } 
        } 
      })
    }
  }, [company, weight, fromAddress, toAddress, navigate])

  useEffect(() => {
    if (fromAddress) {
      setSenderAddress(fromAddress)
    }
    if (toAddress) {
      setRecipientAddress(toAddress)
    }
  }, [fromAddress, toAddress])

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
        weight: parseFloat(weight),
        transport_company_id: company.company_id,
        transport_company_name: company.company_name,
        price: company.price,
      }
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
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Создание заказа...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  )
}

export default OrderPage

