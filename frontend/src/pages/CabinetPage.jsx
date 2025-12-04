import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usersAPI, ordersAPI } from '../api'
import logoSvg from '../assets/images/logo.svg'
import iconVerify from '../assets/images/icon-verify.svg'

function CabinetPage() {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
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
            <Link to="/calculate" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">
              Новый заказ
            </Link>
            <button onClick={handleLogout} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1128px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2D2D2D]">Личный кабинет</h1>
            {profile && (
              <p className="text-[#858585] mt-1">Добро пожаловать, {profile.first_name || profile.username}!</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'orders' ? 'bg-[#0077FE] text-white' : 'bg-white text-[#2D2D2D] border border-[#C8C7CC]'
            }`}
          >
            Мои заказы
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'profile' ? 'bg-[#0077FE] text-white' : 'bg-white text-[#2D2D2D] border border-[#C8C7CC]'
            }`}
          >
            Профиль
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="bg-white border border-[#C8C7CC] rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">У вас пока нет заказов</h3>
                <p className="text-[#858585] mb-6">Создайте первый заказ и начните отправлять посылки</p>
                <Link to="/calculate" className="inline-block px-6 py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white">
                  Создать заказ
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-[#C8C7CC] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-[#2D2D2D]">Заказ #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[#858585]">
                        {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#0077FE]">{order.price} ₽</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-[#858585]">Транспортная компания: </span>
                      <span className="text-[#2D2D2D] font-medium">{order.transport_company_name}</span>
                    </div>
                    {order.external_order_number && (
                      <div>
                        <span className="text-[#858585]">Номер CDEK: </span>
                        <span className="text-[#2D2D2D] font-medium">{order.external_order_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#C8C7CC]">
                    <Link to={`/confirmation/${order.id}`} className="text-[#0077FE] font-semibold text-sm hover:underline">
                      Подробнее →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && profile && (
          <div className="bg-white border border-[#C8C7CC] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-6">Данные профиля</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#858585]">Логин</span>
                <span className="text-base text-[#2D2D2D] font-medium">{profile.username}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#858585]">Email</span>
                <span className="text-base text-[#2D2D2D] font-medium">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[#858585]">Телефон</span>
                  <span className="text-base text-[#2D2D2D] font-medium">{profile.phone}</span>
                </div>
              )}
              {profile.first_name && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[#858585]">Имя</span>
                  <span className="text-base text-[#2D2D2D] font-medium">{profile.first_name}</span>
                </div>
              )}
              {profile.last_name && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[#858585]">Фамилия</span>
                  <span className="text-base text-[#2D2D2D] font-medium">{profile.last_name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex items-center justify-center gap-6 px-6 py-8">
          <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  )
}

export default CabinetPage
