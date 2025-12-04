import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usersAPI, ordersAPI } from '../api'
import './CabinetPage.css'

function CabinetPage() {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        usersAPI.getProfile(),
        ordersAPI.getOrders(),
      ])
      setProfile(profileRes.data)
      setOrders(ordersRes.data.results || ordersRes.data || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="cabinet-page">
      <div className="cabinet-header">
        <h1>Личный кабинет</h1>
        <div className="header-actions">
          <Link to="/calculate" className="btn-primary">Новый заказ</Link>
          <button onClick={handleLogout} className="btn-secondary">Выйти</button>
        </div>
      </div>

      <div className="cabinet-content">
        <div className="profile-section">
          <h2>Профиль</h2>
          {profile && (
            <div className="profile-info">
              <p><strong>Логин:</strong> {profile.username}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              {profile.phone && <p><strong>Телефон:</strong> {profile.phone}</p>}
              {profile.first_name && <p><strong>Имя:</strong> {profile.first_name}</p>}
              {profile.last_name && <p><strong>Фамилия:</strong> {profile.last_name}</p>}
            </div>
          )}
        </div>

        <div className="orders-section">
          <h2>Мои заказы</h2>
          {orders.length === 0 ? (
            <p>У вас пока нет заказов</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>Заказ #{order.id}</h3>
                    <span className={`status status-${order.status}`}>
                      {order.status === 'new' ? 'Новый' : 
                       order.status === 'pending_payment' ? 'Ожидает оплаты' :
                       order.status === 'paid' ? 'Оплачен' :
                       order.status === 'in_delivery' ? 'В доставке' :
                       order.status === 'completed' ? 'Завершен' : 'Отменен'}
                    </span>
                  </div>
                  <p>ТК: {order.transport_company_name}</p>
                  <p>Стоимость: {order.price} ₽</p>
                  {order.external_order_number && (
                    <p>Номер CDEK: {order.external_order_number}</p>
                  )}
                  <p>Дата: {new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                  <Link to={`/confirmation/${order.id}`} className="view-order">
                    Подробнее
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CabinetPage


