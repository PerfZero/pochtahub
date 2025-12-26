import { useNavigate } from 'react-router-dom'

function OrderCompleteStep() {
  const navigate = useNavigate()
  
  return (
    <div className="mb-8">
      <div className="text-center mb-6 md:mb-8">
        <div className="text-4xl md:text-6xl mb-3 md:mb-4">👍</div>
        <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-3 md:mb-4 px-2">
          Готово 👍 Отправление создано
        </h1>
        <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 px-2">
          Получатель выберет и оплатит доставку. Мы сообщим Вам, когда назначим курьера.
        </p>
        <button
          onClick={() => navigate('/cabinet')}
          className="bg-[#0077FE] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors"
        >
          Понятно
        </button>
      </div>
    </div>
  )
}

export default OrderCompleteStep


