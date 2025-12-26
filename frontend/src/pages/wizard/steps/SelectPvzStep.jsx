import CdekMapWidget from '../../../components/CdekMapWidget'

function SelectPvzStep({
  toCity,
  fromCity,
  recipientAddress,
  senderAddress,
  selectedOffer,
  weight,
  length,
  width,
  height,
  recipientDeliveryPointCode,
  onSelect,
  onContinue
}) {
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Выберите пункт выдачи
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-4 md:mb-6 text-center px-2">
        Выберите удобный ПВЗ СДЭК в городе {toCity || 'получателя'}
      </p>
      
      <CdekMapWidget
        city={toCity || recipientAddress}
        cityFrom={fromCity || senderAddress}
        tariffCode={selectedOffer?.tariff_code}
        transportCompanyId={selectedOffer?.company_id || 2}
        weight={parseFloat(weight) || 1}
        length={parseFloat(length) || 20}
        width={parseFloat(width) || 20}
        height={parseFloat(height) || 20}
        onSelect={onSelect}
        selectedCode={recipientDeliveryPointCode}
        recipientAddress={recipientAddress}
      />
      
      <button 
        onClick={onContinue}
        disabled={!recipientDeliveryPointCode}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4 md:mt-6"
      >
        Продолжить
      </button>
    </div>
  )
}

export default SelectPvzStep

