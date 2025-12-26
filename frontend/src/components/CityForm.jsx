import CityInput from './CityInput'

function CityForm({ 
  fromCity, 
  toCity, 
  onFromCityChange, 
  onToCityChange, 
  onSubmit, 
  buttonText = 'Рассчитать и оформить',
  variant = 'default',
  className = '',
  buttonClassName = ''
}) {
  const isHero = variant === 'hero'
  
  if (isHero) {
    return (
      <form 
        className={`flex flex-col md:flex-row rounded-b-[16px] p-2 bg-white items-stretch border-[0.5px] shadow-[0_4px_8px_0_rgba(0,0,0,0.08)] bg-[var(--basic-bg-color)] z-10 relative border-[#C8C7CC] ${className}`}
        onSubmit={onSubmit}
      >
        <div className="flex-1 px-4 md:px-6 py-2 h-[52px]">
          <CityInput
            placeholder="Откуда"
            value={fromCity}
            onChange={onFromCityChange}
            variant="hero"
            label="Откуда"
          />
        </div>
        <div className="flex-1 border-t md:border-t-0 md:border-l-[0.5px] border-[#C8C7CC] px-4 md:px-6 py-2 h-[52px]">
          <CityInput
            placeholder="Куда"
            value={toCity}
            onChange={onToCityChange}
            variant="hero"
            label="Куда"
          />
        </div>
        <div className="flex items-center w-full md:w-[370px] justify-center mt-2 md:mt-0">
          <button 
            type="submit" 
            disabled={!fromCity || !toCity}
            className={`bg-[#0077FE] w-full text-white h-[52px] px-4 py-2 text-base font-semibold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
          >
            {buttonText}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form 
      className={`w-full bg-white border border-[#C8C7CC] rounded-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-stretch p-2 ${className}`}
      onSubmit={onSubmit}
    >
      <div className="flex-1 px-4 md:px-6 py-2 h-[52px]">
        <CityInput
          placeholder="Откуда"
          value={fromCity}
          onChange={onFromCityChange}
          variant="hero"
          label="Откуда"
        />
      </div>
      <div className="flex-1 px-4 md:px-6 py-2 border-t md:border-t-0 md:border-l border-[#C8C7CC] h-[52px]">
        <CityInput
          placeholder="Куда"
          value={toCity}
          onChange={onToCityChange}
          variant="hero"
          label="Куда"
        />
      </div>
      <div className="flex items-center justify-center px-1.5 mt-2 md:mt-0">
        <button 
          type="submit" 
          disabled={!fromCity || !toCity}
          className={`bg-[#0077FE] text-white w-full md:w-auto h-[52px] px-4 py-2 text-base font-semibold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
        >
          {buttonText}
        </button>
      </div>
    </form>
  )
}

export default CityForm

