import { useState, useRef, useEffect } from 'react'

const IconPhone = ({ color = '#2D2D2D' }) => (
  <svg width="32" height="32" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.761194" y="0.761194" width="32.4776" height="32.4776" rx="6" stroke={color} strokeWidth="1.5"/>
    <path d="M20.2985 7.61194H13.7015C12.0199 7.61194 10.6567 8.97513 10.6567 10.6567V23.3433C10.6567 25.0249 12.0199 26.3881 13.7015 26.3881H20.2985C21.9801 26.3881 23.3433 25.0249 23.3433 23.3433V10.6567C23.3433 8.97513 21.9801 7.61194 20.2985 7.61194Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.9851 22.8358H18.0149" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconIron = ({ color = '#2D2D2D' }) => (
  <svg width="32" height="32" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.761194" y="0.761194" width="32.4776" height="32.4776" rx="6" stroke={color} strokeWidth="1.5"/>
    <path d="M14.9701 20.0448H14.9803M13.9552 10.9104H21.5256C22.2463 10.9105 22.9437 11.1662 23.4936 11.6321C24.0435 12.098 24.4103 12.7439 24.5287 13.4549L25.1143 16.9706L25.9364 21.9082C25.9606 22.0534 25.9528 22.2022 25.9137 22.3441C25.8746 22.4861 25.8051 22.6178 25.71 22.7302C25.6149 22.8426 25.4964 22.933 25.3629 22.995C25.2294 23.0571 25.084 23.0893 24.9367 23.0896H7.86567C7.86567 21.2053 8.61418 19.3983 9.94652 18.0659C11.2789 16.7336 13.0859 15.9851 14.9701 15.9851H24.9164M19.0299 20.0448H19.04" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconShoes = ({ color = '#2D2D2D' }) => (
  <svg width="32" height="32" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.761194" y="0.761194" width="32.4776" height="32.4776" rx="6" stroke={color} strokeWidth="1.5"/>
    <path d="M24.2069 23.0896H12.9027C9.9249 23.0896 8.43702 23.0896 7.52866 21.9559C5.80633 19.8042 7.7692 14.0801 8.95768 11.9254C9.3606 14.3612 13.5106 14.2932 15.0219 13.9552C14.015 11.9264 15.3588 11.2494 16.0307 10.9104H16.0327C19.0298 14.4627 25.439 16.3951 27.0091 20.267C27.6881 21.9396 25.7537 23.0896 24.2069 23.0896Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.85075 19.0299C11.0779 20.4812 13.6822 20.9014 17.0223 19.8459C18.0342 19.5261 18.5396 19.3658 18.8553 19.3871C19.1699 19.4094 19.8144 19.7088 21.1013 20.3097C22.7079 21.0587 24.9134 21.49 27.1493 20.4081" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18.5224 14.4627L20.0448 12.9403M20.5522 15.9851L22.0746 14.4627" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconMicrowave = ({ color = '#2D2D2D' }) => (
  <svg width="32" height="32" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.761194" y="0.761194" width="32.4776" height="32.4776" rx="6" stroke={color} strokeWidth="1.5"/>
    <path d="M27.4393 9.17063H6.5608C6.33008 9.17063 6.10881 9.26228 5.94567 9.42543C5.78252 9.58857 5.69087 9.80984 5.69087 10.0406V23.9595C5.69087 24.1903 5.78252 24.4115 5.94567 24.5747C6.10881 24.7378 6.33008 24.8295 6.5608 24.8295H27.4393C27.67 24.8295 27.8913 24.7378 28.0544 24.5747C28.2176 24.4115 28.3092 24.1903 28.3092 23.9595V10.0406C28.3092 9.80984 28.2176 9.58857 28.0544 9.42543C27.8913 9.26228 27.67 9.17063 27.4393 9.17063Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.9594 13.5203H24.8294M23.9594 17.0001H24.8294M19.6097 12.6504H10.0404C9.80972 12.6504 9.58845 12.742 9.4253 12.9052C9.26216 13.0683 9.1705 13.2896 9.1705 13.5203V20.4798C9.1705 20.7105 9.26216 20.9318 9.4253 21.095C9.58845 21.2581 9.80972 21.3498 10.0404 21.3498H19.6097C19.8405 21.3498 20.0617 21.2581 20.2249 21.095C20.388 20.9318 20.4797 20.7105 20.4797 20.4798V13.5203C20.4797 13.2896 20.388 13.0683 20.2249 12.9052C20.0617 12.742 19.8405 12.6504 19.6097 12.6504Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const sizeOptions = [
  {
    id: 'smartphone',
    name: 'Как коробка от смартфона',
    size: '17х12х9 см, до 1 кг',
    Icon: IconPhone
  },
  {
    id: 'iron',
    name: 'Как коробка от утюга',
    size: '21х20х11 см, до 3 кг',
    Icon: IconIron
  },
  {
    id: 'shoes',
    name: 'Как коробка от обуви',
    size: '33х25х15 см, до 7 кг',
    Icon: IconShoes
  },
  {
    id: 'microwave',
    name: 'Как коробка от микроволновки',
    size: '42х35х30 см, до 15кг',
    Icon: IconMicrowave
  }
]

function SizeDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState(value || null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (option) => {
    setSelectedSize(option)
    onChange(option)
    setIsOpen(false)
  }

  const handleCustomSize = () => {
    setIsOpen(false)
  }

  const handleUploadPhoto = () => {
    setIsOpen(false)
  }

  const selectedOption = sizeOptions.find(opt => opt.id === selectedSize?.id)

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4"
      >
        <span className={`text-sm font-semibold ${selectedOption ? 'text-[#2D2D2D]' : 'text-[#858585]'}`}>
          {selectedOption ? selectedOption.name : 'Выберите размер'}
        </span>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M7 10L12 15L17 10" stroke="#0077FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[300px] bg-white rounded-xl shadow-[0px_4px_16px_0px_rgba(45,45,45,0.12)] z-50 overflow-hidden">
          <div className="p-1 flex flex-col gap-0.5">
            {sizeOptions.map((option) => {
              const isSelected = selectedSize?.id === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isSelected 
                      ? 'bg-[#F4F2F3]' 
                      : 'hover:bg-[#F4F2F3]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md flex items-center justify-center">
                    <option.Icon color={isSelected ? '#0077FE' : '#2D2D2D'} />
                  </div>
                  <div className="flex-1 flex flex-col items-start
">
                    <span className={`text-sm font-semibold ${
                      isSelected ? 'text-[#0077FE]' : 'text-[#2D2D2D]'
                    }`}>
                      {option.name}
                    </span>
                    <span className="text-sm text-[#2D2D2D]">
                      {option.size}
                    </span>
                  </div>
                </button>
              )
            })}
            
            <div className="h-px bg-[#F4F2F3] my-1"></div>
            
            <button
              type="button"
              onClick={handleCustomSize}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F2F3] transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-xl">✏️</span>
              </div>
              <span className="text-sm font-semibold text-[#2D2D2D]">
                Я знаю точные размеры
              </span>
            </button>
            
            <button
              type="button"
              onClick={handleUploadPhoto}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F2F3] transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-xl">📸️</span>
              </div>
              <span className="text-sm font-semibold text-[#2D2D2D]">
                Загрузить фото
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SizeDropdown
