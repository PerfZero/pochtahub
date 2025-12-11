import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import logoSvg from '../assets/whitelogo.svg'

function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderData = location.state || {}
  
  const wizardData = orderData.wizardData || {}
  const offer = {
    company_id: orderData.company,
    company_name: orderData.companyName || 'CDEK',
    price: orderData.price || 0,
    tariff_code: orderData.tariffCode,
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

  const getCompanyInitial = (name) => {
    if (!name) return 'C'
    return name.charAt(0).toUpperCase()
  }

  const handlePayment = () => {
    navigate('/order', {
      state: {
        ...orderData,
        orderData: {
          company: offer.company_id,
          companyName: offer.company_name,
          price: offer.price,
          tariffCode: offer.tariff_code,
          deliveryTime: offer.delivery_time,
          fromCity: wizardData.fromCity,
          toCity: wizardData.toCity,
          fromAddress: wizardData.senderAddress || wizardData.fromCity,
          toAddress: wizardData.deliveryAddress || wizardData.recipientAddress || wizardData.toCity,
          weight: wizardData.weight,
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-6 py-6 gap-6">
        <img src={logoSvg} alt="PochtaHub" className="h-8" />
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
              className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors mb-6"
            >
              Перейти к оплате
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
