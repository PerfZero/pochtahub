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
  const [tracking, setTracking] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [loadingTracking, setLoadingTracking] = useState(false)

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

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true)
    try {
      const response = await ordersAPI.updateStatusFromCdek(orderId)
      await loadOrder()
      alert('Статус заказа обновлен!')
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
      alert(`Ошибка обновления статуса: ${error.response?.data?.error || error.message}`)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const loadTracking = async () => {
    if (!order?.external_order_number && !order?.external_order_uuid) {
      return
    }
    setLoadingTracking(true)
    try {
      const response = await ordersAPI.getOrderTracking(orderId)
      setTracking(response.data)
    } catch (error) {
      console.error('Ошибка загрузки трекинга:', error)
    } finally {
      setLoadingTracking(false)
    }
  }

  const handleDownloadDocuments = async () => {
    try {
      const response = await ordersAPI.getOrderDocuments(orderId)
      if (response.data.success && response.data.base64) {
        const byteCharacters = atob(response.data.base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `order_${orderId}_cdek.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Не удалось получить документы')
      }
    } catch (error) {
      console.error('Ошибка получения документов:', error)
      alert(`Ошибка получения документов: ${error.response?.data?.error || error.message}`)
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
          {order.external_order_number && (
            <p>Номер заказа CDEK: {order.external_order_number}</p>
          )}
          {order.external_order_uuid && !order.external_order_number && (
            <p>UUID заказа CDEK: {order.external_order_uuid}</p>
          )}
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

      <div className="action-buttons">
        {order.status === 'pending_payment' || order.status === 'new' ? (
          <button onClick={handlePayment} disabled={paying} className="pay-button">
            {paying ? 'Обработка...' : 'Оплатить'}
          </button>
        ) : null}
        
        {order.transport_company_name?.toLowerCase().includes('сдэк') && (
          <>
            <button onClick={handleUpdateStatus} disabled={updatingStatus} className="update-status-button">
              {updatingStatus ? 'Обновление...' : 'Обновить статус из CDEK'}
            </button>
            <button onClick={handleDownloadDocuments} className="documents-button">
              Скачать накладную
            </button>
            <button onClick={loadTracking} disabled={loadingTracking} className="tracking-button">
              {loadingTracking ? 'Загрузка...' : 'История статусов'}
            </button>
          </>
        )}
      </div>

      {tracking && tracking.tracking_history && tracking.tracking_history.length > 0 && (
        <div className="tracking-section">
          <h3>История статусов</h3>
          <div className="tracking-list">
            {tracking.tracking_history.map((item, index) => (
              <div key={index} className="tracking-item">
                <div className="tracking-date">{new Date(item.date_time).toLocaleString('ru-RU')}</div>
                <div className="tracking-status">{item.status_name}</div>
                {item.city && <div className="tracking-city">{item.city}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/cabinet')} className="cabinet-button">
        Перейти в личный кабинет
      </button>
    </div>
  )
}

export default ConfirmationPage

