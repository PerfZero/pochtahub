import { useState } from 'react'
import AddressInput from '../components/AddressInput'

const testAddresses = [
  // Корректные адреса с номером дома
  { address: 'ул Ленина 15', expected: true, description: 'Улица + номер дома' },
  { address: 'пр. Мира 25а', expected: true, description: 'Проспект + номер дома с буквой' },
  { address: 'пер. Садовый 8/2', expected: true, description: 'Переулок + дробный номер дома' },
  { address: 'наб. Невы 12', expected: true, description: 'Набережная + номер дома' },
  { address: 'пл. Победы 1', expected: true, description: 'Площадь + номер дома' },
  { address: 'ш. Энтузиастов 45', expected: true, description: 'Шоссе + номер дома' },
  { address: 'б-р. Бумажный 7', expected: true, description: 'Бульвар + номер дома' },
  { address: 'туп. 1-й Тверской 3', expected: true, description: 'Тупик + номер дома' },
  
  // Проблемные адреса (номер улицы, а не дома)
  { address: 'ул 22 Партсъезда', expected: false, description: 'Улица с номером 22 (проблемный случай)' },
  { address: '1-й ул. Май', expected: false, description: '1-й улица Май' },
  { address: '2-й пер. Солнечный', expected: false, description: '2-й переулок Солнечный' },
  { address: '3-й пр-кт. Ленина', expected: false, description: '3-й проспект Ленина' },
  
  // Адреса без номера дома
  { address: 'ул Ленина', expected: false, description: 'Улица без номера дома' },
  { address: 'пр. Мира', expected: false, description: 'Проспект без номера дома' },
  { address: 'пер. Садовый', expected: false, description: 'Переулок без номера дома' },
  
  // Адреса с номерами в названии улицы
  { address: 'ул 8 Марта 15', expected: true, description: 'Улица 8 Марта + номер дома 15' },
  { address: 'пр. 1 Мая 10', expected: true, description: 'Проспект 1 Мая + номер дома 10' },
  { address: 'ул 1905 года 5', expected: true, description: 'Улица 1905 года + номер дома 5' },
  
  // Сложные случаи
  { address: 'ул. Карла Маркса, д. 25, кв. 12', expected: true, description: 'Полный адрес с квартирой' },
  { address: 'Ленинский пр-т, 78', expected: true, description: 'Проспект через запятую' },
  { address: 'ул. Новая, 33 корпус 2', expected: true, description: 'С корпусом' },
  { address: 'ул. Центральная, стр. 1', expected: true, description: 'Со строением' },
  
  // Крайние случаи
  { address: '22', expected: false, description: 'Только цифры' },
  { address: 'а/я 123', expected: false, description: 'Абонентский ящик' },
  { address: 'ул. Безымянная', expected: false, description: 'Улица без номера' },
]

function AddressValidationTest() {
  const [results, setResults] = useState([])
  const [currentTest, setCurrentTest] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async (testAddress) => {
    setCurrentTest(testAddress)
    setIsRunning(true)
    
    // Имитируем выбор адреса из DaData
    return new Promise((resolve) => {
      setTimeout(() => {
        // Здесь должна быть реальная проверка через DaData
        // Для теста имитируем разные сценарии
        const hasHouse = testAddress.expected
        
        resolve({
          address: testAddress.address,
          expected: testAddress.expected,
          actual: hasHouse,
          description: testAddress.description,
          passed: testAddress.expected === hasHouse
        })
      }, 500)
    })
  }

  const runAllTests = async () => {
    setIsRunning(true)
    const testResults = []
    
    for (const testAddress of testAddresses) {
      const result = await runTest(testAddress)
      testResults.push(result)
    }
    
    setResults(testResults)
    setIsRunning(false)
    setCurrentTest(null)
  }

  const clearResults = () => {
    setResults([])
    setCurrentTest(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Тесты валидации адресов</h1>
      
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-4"
        >
          {isRunning ? 'Тестирование...' : 'Запустить все тесты'}
        </button>
        <button
          onClick={clearResults}
          disabled={isRunning}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Очистить результаты
        </button>
      </div>

      {currentTest && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">Тестирую: <strong>{currentTest.address}</strong></p>
          <p className="text-xs text-gray-600">{currentTest.description}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Результаты тестов</h2>
          
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded border ${
                result.passed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{result.address}</p>
                  <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                  <div className="text-sm">
                    <span className="mr-4">
                      Ожидается: <strong>{result.expected ? '✓' : '✗'}</strong>
                    </span>
                    <span>
                      Фактически: <strong>{result.actual ? '✓' : '✗'}</strong>
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-semibold ${
                  result.passed 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Статистика:</h3>
            <div className="text-sm">
              <p>Всего тестов: {results.length}</p>
              <p>Пройдено: {results.filter(r => r.passed).length}</p>
              <p>Провалено: {results.filter(r => !r.passed).length}</p>
              <p>Успешность: {Math.round((results.filter(r => r.passed).length / results.length) * 100)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Тестовые адреса:</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {testAddresses.map((test, index) => (
            <div key={index} className="p-2 border rounded">
              <p className="font-semibold">{test.address}</p>
              <p className="text-gray-600">{test.description}</p>
              <p className="text-xs">
                Ожидаемый результат: {test.expected ? '✓ Валидный' : '✗ Невалидный'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AddressValidationTest
