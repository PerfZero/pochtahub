import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ordersAPI, paymentAPI } from '../api'
import logoSvg from '../assets/images/logo.svg'
import iconVerify from '../assets/images/icon-verify.svg'

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
      const response = await ordersAPI.getOrder(orderId)
      setOrder(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    console.log('[PAYMENT FRONTEND] Начало оплаты для заказа:', orderId)
    setPaying(true)
    try {
      console.log('[PAYMENT FRONTEND] Отправка запроса на оплату...')
      const response = await paymentAPI.createPayment(orderId)
      console.log('[PAYMENT FRONTEND] Ответ от сервера:', response)
      await loadOrder()
      alert('Оплата успешно обработана!')
    } catch (error) {
      console.error('[PAYMENT FRONTEND] Ошибка оплаты:', error)
      console.error('[PAYMENT FRONTEND] Детали ошибки:', error.response?.data)
      alert(`Ошибка при оплате: ${error.response?.data?.error || error.message}`)
    } finally {
      setPaying(false)
    }
  }

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true)
    try {
      await ordersAPI.updateStatusFromCdek(orderId)
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

  const getStatusStyle = (status) => {
    const styles = {
      new: 'bg-[#FFF3CD] text-[#856404]',
      pending_payment: 'bg-[#D1ECF1] text-[#0C5460]',
      paid: 'bg-[#D4EDDA] text-[#155724]',
      in_delivery: 'bg-[#CCE5FF] text-[#004085]',
      completed: 'bg-[#D1F2EB] text-[#00695C]',
      cancelled: 'bg-[#F8D7DA] text-[#721C24]',
    }
    return styles[status] || 'bg-[#F4EEE2] text-[#2D2D2D]'
  }

  const getStatusText = (status) => {
    const texts = {
      new: 'Новый',
      pending_payment: 'Ожидает оплаты',
      paid: 'Оплачен',
      in_delivery: 'В доставке',
      completed: 'Завершен',
      cancelled: 'Отменен',
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#F4EEE2] border-t-[#0077FE] rounded-full animate-spin"></div>
          <p className="text-[#2D2D2D]">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="w-full flex justify-center items-center p-6 border-b border-[#C8C7CC]">
          <div className="w-full max-w-[1128px] flex items-center gap-6">
            <Link to="/calculate">
              <img src={logoSvg} alt="PochtaHub" className="h-8" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">Заказ не найден</h1>
            <Link to="/cabinet" className="text-[#0077FE] font-semibold hover:underline">
              Вернуться в личный кабинет
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      <header className="w-full bg-white border-b border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex items-center gap-6 p-6">
          <Link to="/">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/cabinet" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">
              Личный кабинет
            </Link>
            <Link to="/calculate" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">
              Новый заказ
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[800px] mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to="/cabinet" className="text-[#0077FE] text-sm font-medium hover:underline">
            ← Назад к заказам
          </Link>
        </div>

        <div className="bg-white border border-[#C8C7CC] rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-[#C8C7CC]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#2D2D2D]">Заказ #{order.id}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-[#858585]">{order.transport_company_name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#0077FE]">{order.price} ₽</div>
              {order.external_order_number && (
                <p className="text-sm text-[#858585] mt-1">CDEK: {order.external_order_number}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="bg-[#F9F9F9] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">Отправитель</h3>
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium text-[#2D2D2D]">{order.sender_name}</p>
                <p className="text-sm text-[#2D2D2D]">{order.sender_phone}</p>
                <p className="text-sm text-[#858585]">{order.sender_address}, {order.sender_city}</p>
              </div>
            </div>

            <div className="bg-[#F9F9F9] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">Получатель</h3>
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium text-[#2D2D2D]">{order.recipient_name}</p>
                <p className="text-sm text-[#2D2D2D]">{order.recipient_phone}</p>
                <p className="text-sm text-[#858585]">{order.recipient_address}, {order.recipient_city}</p>
              </div>
            </div>
          </div>

          {order.package_image && (
            <div className="mt-6 pt-6 border-t border-[#C8C7CC]">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">Фото посылки</h3>
              <div className="flex justify-center">
                <img
                  src={order.package_image}
                  alt="Фото посылки"
                  className="max-w-full h-auto rounded-lg max-h-96 border border-[#C8C7CC] shadow-sm"
                  onError={(e) => {
                    console.error('Ошибка загрузки изображения:', order.package_image)
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-[#2D2D2D] mb-4">Действия</h3>
          <div className="flex flex-wrap gap-3">
            {(order.status === 'pending_payment' || order.status === 'new') && (
              <button
                onClick={handlePayment}
                disabled={paying}
                className="px-6 py-3 rounded-xl text-base font-semibold bg-[#0077FE] text-white disabled:opacity-50"
              >
                {paying ? 'Обработка...' : 'Оплатить заказ'}
              </button>
            )}
            
            {order.transport_company_name?.toLowerCase().includes('сдэк') && (
              <>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="px-6 py-3 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D] disabled:opacity-50"
                >
                  {updatingStatus ? 'Обновление...' : 'Обновить статус'}
                </button>
                <button
                  onClick={handleDownloadDocuments}
                  className="px-6 py-3 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                >
                  Скачать накладную
                </button>
                <button
                  onClick={loadTracking}
                  disabled={loadingTracking}
                  className="px-6 py-3 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D] disabled:opacity-50"
                >
                  {loadingTracking ? 'Загрузка...' : 'История статусов'}
                </button>
              </>
            )}
          </div>
        </div>

        {tracking && tracking.tracking_history && tracking.tracking_history.length > 0 && (
          <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[#2D2D2D] mb-4">История статусов</h3>
            <div className="flex flex-col gap-4">
              {tracking.tracking_history.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-[#0077FE] shrink-0"></div>
                  <div className="flex-1 pb-4 border-b border-[#C8C7CC] last:border-0">
                    <p className="text-base font-medium text-[#2D2D2D]">{item.status_name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-[#858585]">
                        {new Date(item.date_time).toLocaleString('ru-RU')}
                      </span>
                      {item.city && <span className="text-sm text-[#858585]">{item.city}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex items-center justify-center gap-6 px-6 py-8">
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          </Link>
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  )
}

export default ConfirmationPage
