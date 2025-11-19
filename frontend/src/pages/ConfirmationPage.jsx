import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI, paymentAPI } from '../api'
import './ConfirmationPage.css'

function ConfirmationPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId || orderId === 'undefined') {
      console.error('OrderId is undefined')
      setLoading(false)
      return
    }
    
    try {
      console.log('Loading order with ID:', orderId)
      const response = await ordersAPI.getOrder(orderId)
      console.log('Order loaded:', response.data)
      setOrder(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
      console.error('Error response:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaying(true)
    try {
      await paymentAPI.createPayment(orderId)
      await loadOrder()
      alert('Оплата успешно обработана!')
    } catch (error) {
      console.error('Ошибка оплаты:', error)
      alert('Ошибка при оплате')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  if (!order) {
    return <div>Заказ не найден</div>
  }

  return (
    <div className="confirmation-page">
      <h1>Заказ #{order.id}</h1>
      <div className="order-info">
        <div className="info-section">
          <h2>Статус: {order.status === 'new' ? 'Новый' : 
                       order.status === 'pending_payment' ? 'Ожидает оплаты' :
                       order.status === 'paid' ? 'Оплачен' :
                       order.status === 'in_delivery' ? 'В доставке' :
                       order.status === 'completed' ? 'Завершен' : 'Отменен'}</h2>
          <p>Транспортная компания: {order.transport_company_name}</p>
          <p>Стоимость: {order.price} ₽</p>
        </div>

        <div className="info-section">
          <h3>Отправитель</h3>
          <p>{order.sender_name}</p>
          <p>{order.sender_phone}</p>
          <p>{order.sender_address}, {order.sender_city}</p>
        </div>

        <div className="info-section">
          <h3>Получатель</h3>
          <p>{order.recipient_name}</p>
          <p>{order.recipient_phone}</p>
          <p>{order.recipient_address}, {order.recipient_city}</p>
        </div>
      </div>

      {order.status === 'pending_payment' || order.status === 'new' ? (
        <button onClick={handlePayment} disabled={paying} className="pay-button">
          {paying ? 'Обработка...' : 'Оплатить'}
        </button>
      ) : null}

      <button onClick={() => navigate('/cabinet')} className="cabinet-button">
        Перейти в личный кабинет
      </button>
    </div>
  )
}

export default ConfirmationPage

