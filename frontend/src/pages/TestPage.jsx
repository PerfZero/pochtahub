import { useState } from 'react'
import AddressInput from '../components/AddressInput'
import AddressValidationTest from '../components/AddressValidationTest'
import DadataAddressTest from '../components/DadataAddressTest'

function TestPage() {
  const [activeTab, setActiveTab] = useState('quick')
  const [address, setAddress] = useState('')
  const [hasHouse, setHasHouse] = useState(false)

  const handleHouseValidation = (hasHouseFromDadata) => {
    setHasHouse(hasHouseFromDadata)
  }

  const problematicAddresses = [
    'ул 22 Партсъезда',
    '1-й ул. Май',
    '2-й пер. Солнечный',
    '3-й пр-кт. Ленина',
    'ул 8 Марта 15',
    'пр. 1 Мая 10',
    'ул 1905 года 5',
    'ул Ленина',
    'ул Ленина 15',
    'пр. Мира 25а',
    'пер. Садовый 8/2',
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Тестирование валидации адресов</h1>
      
      {/* Табы */}
      <div className="mb-6 border-b">
        <div className="flex space-x-8">
          {[
            { id: 'quick', label: 'Быстрый тест' },
            { id: 'mock', label: 'Мок-тесты' },
            { id: 'dadata', label: 'DaData тесты' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Быстрый тест */}
      {activeTab === 'quick' && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Быстрый тест валидации</h2>
          <div className="mb-4">
            <AddressInput
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onHouseValidation={handleHouseValidation}
              label="Введите адрес для теста"
              city="Москва"
            />
          </div>
          <div className="text-sm mb-4">
            <p>Текущий адрес: <strong>{address || 'пусто'}</strong></p>
            <p>Наличие дома (DaData): <strong>{hasHouse ? '✓ Да' : '✗ Нет'}</strong></p>
            <p>Проверка по цифрам: <strong>{/\d/.test(address) ? '✓ Есть цифры' : '✗ Нет цифр'}</strong></p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Проблемные адреса для быстрого теста:</h3>
            <div className="grid grid-cols-2 gap-2">
              {problematicAddresses.map((addr, index) => (
                <button
                  key={index}
                  onClick={() => setAddress(addr)}
                  className="text-left p-2 border rounded hover:bg-gray-50 text-sm"
                >
                  {addr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Мок-тесты */}
      {activeTab === 'mock' && (
        <AddressValidationTest />
      )}

      {/* DaData тесты */}
      {activeTab === 'dadata' && (
        <DadataAddressTest />
      )}
    </div>
  )
}

export default TestPage
