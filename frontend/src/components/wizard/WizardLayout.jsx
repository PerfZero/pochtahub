import { Link } from 'react-router-dom'
import logoSvg from '../../assets/whitelogo.svg'
import CityInput from '../CityInput'

function WizardLayout({ 
  fromCity, 
  toCity, 
  onFromCityChange, 
  onToCityChange, 
  onCalculate,
  progress,
  progressText,
  onBack,
  children 
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-4 md:px-6 py-4 md:py-6 gap-4 md:gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
        </Link>
        <div className="w-full max-w-[720px] bg-white rounded-2xl flex flex-col md:flex-row items-stretch p-2 gap-2 md:gap-0">
          <div className="flex-1 px-4 md:px-6 py-2 border-b md:border-b-0 md:border-r border-[#E5E5E5]">
            <CityInput
              placeholder="Откуда"
              value={fromCity}
              onChange={onFromCityChange}
              variant="hero"
              label="Откуда"
            />
          </div>
          <div className="flex-1 px-4 md:px-6 py-2 border-b md:border-b-0 md:border-r border-[#E5E5E5]">
            <CityInput
              placeholder="Куда"
              value={toCity}
              onChange={onToCityChange}
              variant="hero"
              label="Куда"
            />
          </div>
          <button 
            onClick={onCalculate}
            disabled={!fromCity || !toCity}
            className="bg-[#0077FE] text-white px-4 py-3 md:py-2 text-sm md:text-base font-semibold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Рассчитать стоимость
          </button>
        </div>
      </header>

      <div className="flex justify-center pt-6 md:pt-12 pb-8">
        <div className="w-full max-w-[720px] bg-white rounded-2xl p-4 md:p-8 mx-4 md:mx-6">
          <div className="mb-6">
            <div className="w-full h-1 bg-[#E5F0FF] rounded-full overflow-hidden">
              <div className="h-full bg-[#0077FE]" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-[#858585] mt-2 text-center">
              {progressText}
            </p>
          </div>

          {children}

          <div className="text-center">
            <button
              onClick={onBack || (() => window.history.back())}
              className="text-sm text-[#858585] hover:text-[#2D2D2D] transition-colors"
            >
              ← Вернуться назад
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WizardLayout



