import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import logoSvg from '../assets/whitelogo.svg'
import { ordersAPI } from '../api'

function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderData = location.state || {}
  
  const wizardData = orderData.wizardData || {}
  const offer = {
    company_id: orderData.company,
    company_name: orderData.companyName || 'CDEK',
    company_code: orderData.companyCode || 'cdek',
    price: orderData.price || 0,
    tariff_code: orderData.tariffCode,
    tariff_name: orderData.tariffName,
    delivery_time: orderData.deliveryTime,
  }

  const dimensions = wizardData.length && wizardData.width && wizardData.height
    ? `${wizardData.length} см х ${wizardData.width} см х ${wizardData.height} см`
    : 'Размеры не указаны'
  const weight = `${wizardData.weight || 1} кг`
  
  const deliveryPrice = offer.price || 0
  const packagingPrice = 50
  const storagePrice = 50
  const insurancePrice = 10
  const totalPrice = deliveryPrice + packagingPrice + storagePrice + insurancePrice

  const [loading, setLoading] = useState(false)

  const getCompanyInitial = (name) => {
    if (!name) return 'C'
    return name.charAt(0).toUpperCase()
  }

  const handlePayment = async () => {
    const senderName = wizardData.senderFIO || wizardData.senderName
    const senderPhone = wizardData.senderPhone || wizardData.userPhone
    const recipientName = wizardData.recipientFIO || wizardData.recipientName
    const recipientPhone = wizardData.recipientPhone
    const recipientAddress = wizardData.deliveryAddress || wizardData.recipientAddress
    const selectedRole = wizardData.selectedRole || 'sender'
    
    if (selectedRole === 'sender' && (!recipientAddress || !recipientName)) {
      const updatedWizardData = {
        ...wizardData,
        selectedOffer: {
          company_id: offer.company_id,
          company_name: offer.company_name,
          company_code: offer.company_code,
          price: offer.price,
          tariff_code: offer.tariff_code,
          tariff_name: offer.tariff_name,
          delivery_time: offer.delivery_time,
        },
        returnToPayment: true,
      }
      
      navigate('/wizard', {
        state: {
          wizardData: updatedWizardData,
          currentStep: 'recipientAddress',
        }
      })
      return
    }
    
    if (!senderName || !senderPhone || !recipientName || !recipientPhone) {
      console.log('Проверка полей:', { senderName, senderPhone, recipientName, recipientPhone, wizardData })
      alert('Заполните все обязательные поля: имя и телефон отправителя и получателя')
      return
    }

    setLoading(true)
    try {
      const orderData = {
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_address: wizardData.senderAddress || wizardData.fromCity,
        sender_city: wizardData.fromCity,
        sender_company: wizardData.senderCompany || null,
        sender_tin: wizardData.senderTin || null,
        sender_contragent_type: wizardData.senderContragentType || null,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: wizardData.deliveryAddress || wizardData.recipientAddress || wizardData.toCity,
        recipient_city: wizardData.toCity,
        recipient_delivery_point_code: wizardData.recipientDeliveryPointCode || null,
        weight: parseFloat(wizardData.weight),
        length: wizardData.length ? parseFloat(wizardData.length) : null,
        width: wizardData.width ? parseFloat(wizardData.width) : null,
        height: wizardData.height ? parseFloat(wizardData.height) : null,
        transport_company_id: offer.company_id,
        transport_company_name: offer.company_name,
        price: offer.price,
        tariff_code: offer.tariff_code,
        tariff_name: offer.tariff_name,
      }
      
      const response = await ordersAPI.createOrder(orderData)
      const orderId = response.data?.id || response.data?.pk
      
      if (orderId) {
        navigate(`/confirmation/${orderId}`)
      } else {
        alert('Ошибка: ID заказа не получен')
        setLoading(false)
      }
    } catch (error) {
      alert(`Ошибка создания заказа: ${error.response?.data?.detail || error.response?.data?.error || error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-6 py-6 gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-8" />
        </Link>
      </header>

      <div className="flex justify-center pt-12 pb-8">
        <div className="w-full max-w-[720px] mx-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-[#2D2D2D] mb-8">
              Оплата доставки
            </h1>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4">Посылка</h2>
              <p className="text-base text-[#2D2D2D]">
                {dimensions}, {weight}
              </p>
            </div>

            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                <span className="text-base text-[#858585]">Отправитель</span>
                <span className="text-base font-semibold text-[#2D2D2D] text-right">
                  {wizardData.senderFIO || ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                <span className="text-base text-[#858585]">Телефон отправителя</span>
                <span className="text-base font-semibold text-[#2D2D2D]">
                  {wizardData.senderPhone || wizardData.userPhone || '+7 (___) ___-__-__'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                <span className="text-base text-[#858585]">Откуда</span>
                <span className="text-base font-semibold text-[#2D2D2D] text-right">
                  {wizardData.senderAddress || wizardData.fromCity || ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                <span className="text-base text-[#858585]">Получатель</span>
                <span className="text-base font-semibold text-[#2D2D2D] text-right">
                  {wizardData.recipientFIO || ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                <span className="text-base text-[#858585]">Телефон получателя</span>
                <span className="text-base font-semibold text-[#2D2D2D]">
                  {wizardData.recipientPhone || '+7 (___) ___-__-__'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-base text-[#858585]">Куда</span>
                <span className="text-base font-semibold text-[#2D2D2D] text-right">
                  {wizardData.deliveryAddress || wizardData.recipientAddress || wizardData.toCity || ''}
                </span>
              </div>
              {wizardData.recipientDeliveryPointCode && (
                <div className="flex justify-between items-start py-3 border-t border-dashed border-[#E5E5E5]">
                  <span className="text-base text-[#858585]">Пункт выдачи</span>
                  <div className="text-right">
                    <span className="text-base font-semibold text-[#2D2D2D] block">
                      {wizardData.recipientDeliveryPointAddress || wizardData.recipientDeliveryPointCode}
                    </span>
                    <span className="text-xs text-[#858585]">
                      Код: {wizardData.recipientDeliveryPointCode}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4">Ожидает оплаты</h2>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-lg font-bold">
                  {getCompanyInitial(offer.company_name)}
                </div>
                <span className="text-lg font-semibold text-[#2D2D2D]">
                  {offer.company_name}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                  <span className="text-base text-[#858585]">Стоимость доставки</span>
                  <span className="text-base font-semibold text-[#2D2D2D]">
                    {deliveryPrice.toLocaleString('ru-RU')}₽
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                  <span className="text-base text-[#858585]">Стоимость упаковки</span>
                  <span className="text-base font-semibold text-[#2D2D2D]">
                    {packagingPrice.toLocaleString('ru-RU')}₽
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5E5]">
                  <span className="text-base text-[#858585]">Стоимость хранения</span>
                  <span className="text-base font-semibold text-[#2D2D2D]">
                    {storagePrice.toLocaleString('ru-RU')}₽
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-base text-[#858585]">Страховка</span>
                  <span className="text-base font-semibold text-[#2D2D2D]">
                    {insurancePrice.toLocaleString('ru-RU')}₽
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-[#E5E5E5]">
                <div>
                  <p className="text-2xl font-bold text-[#2D2D2D] mb-2">
                    Итого: {totalPrice.toLocaleString('ru-RU')}₽
                  </p>
                  {offer.delivery_time && (
                    <p className="text-sm text-[#858585]">
                      Доставка за {offer.delivery_time} {offer.delivery_time === 1 ? 'дн.' : 'дн.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors mb-6 disabled:opacity-50"
            >
              {loading ? 'Создание заказа...' : 'Оформить заказ'}
            </button>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/offers"
              state={{ wizardData }}
              className="text-sm text-[#858585] hover:text-[#2D2D2D] transition-colors"
            >
              ← Выбрать другую службу доставки
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
