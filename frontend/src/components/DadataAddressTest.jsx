import { useState, useEffect } from 'react'
import axios from 'axios'

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || ''

const testCases = [
  // Корректные адреса
  { address: 'ул Ленина 15', city: 'Москва', expected: true, description: 'Улица + номер дома' },
  { address: 'пр. Мира 25а', city: 'Москва', expected: true, description: 'Проспект + номер дома с буквой' },
  { address: 'пер. Садовый 8/2', city: 'Санкт-Петербург', expected: true, description: 'Переулок + дробный номер дома' },
  { address: 'наб. Невы 12', city: 'Санкт-Петербург', expected: true, description: 'Набережная + номер дома' },
  
  // Проблемные адреса (номер улицы, а не дома)
  { address: 'ул 22 Партсъезда', city: 'Москва', expected: false, description: 'Улица с номером 22 (проблемный случай)' },
  { address: '1-й ул. Май', city: 'Москва', expected: false, description: '1-й улица Май' },
  { address: '2-й пер. Солнечный', city: 'Москва', expected: false, description: '2-й переулок Солнечный' },
  { address: '3-й пр-кт. Ленина', city: 'Санкт-Петербург', expected: false, description: '3-й проспект Ленина' },
  
  // Адреса без номера дома
  { address: 'ул Ленина', city: 'Москва', expected: false, description: 'Улица без номера дома' },
  { address: 'пр. Мира', city: 'Москва', expected: false, description: 'Проспект без номера дома' },
  { address: 'пер. Садовый', city: 'Санкт-Петербург', expected: false, description: 'Переулок без номера дома' },
  
  // Адреса с номерами в названии улицы
  { address: 'ул 8 Марта 15', city: 'Москва', expected: true, description: 'Улица 8 Марта + номер дома 15' },
  { address: 'пр. 1 Мая 10', city: 'Москва', expected: true, description: 'Проспект 1 Мая + номер дома 10' },
  { address: 'ул 1905 года 5', city: 'Москва', expected: true, description: 'Улица 1905 года + номер дома 5' },
  
  // Сложные случаи
  { address: 'ул. Карла Маркса, д. 25', city: 'Москва', expected: true, description: 'Полный адрес с домом' },
  { address: 'Ленинский пр-т, 78', city: 'Москва', expected: true, description: 'Проспект через запятую' },
  { address: 'ул. Новая, 33 корпус 2', city: 'Москва', expected: true, description: 'С корпусом' },
  { address: 'ул. Центральная, стр. 1', city: 'Москва', expected: true, description: 'Со строением' },
]

function DadataAddressTest() {
  const [results, setResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState(null)
  const [dadataToken, setDadataToken] = useState(DADATA_TOKEN)

  const testWithDadata = async (testCase) => {
    setCurrentTest(testCase)
    
    if (!dadataToken) {
      return {
        ...testCase,
        actual: false,
        passed: false,
        error: 'Нет токена DaData',
        dadataResponse: null
      }
    }

    try {
      const cleanCity = testCase.city.replace(/^г\.?\s*/i, '').trim()
      
      const response = await axios.post(
        DADATA_API_URL,
        { 
          query: testCase.address, 
          count: 5,
          locations: [{ city: cleanCity }],
          restrict_value: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${dadataToken}`,
          },
        }
      )

      const suggestions = response.data.suggestions
      
      // Ищем точное совпадение или очень похожий адрес
      const exactMatch = suggestions.find(s => {
        const normalizedQuery = testCase.address.toLowerCase().replace(/[,\s]+/g, ' ').trim()
        const normalizedSuggestion = s.value.toLowerCase().replace(/[,\s]+/g, ' ').trim()
        return normalizedQuery === normalizedSuggestion || 
               normalizedSuggestion.includes(normalizedQuery) ||
               normalizedQuery.includes(normalizedSuggestion)
      })
      
      const hasHouse = exactMatch ? !!exactMatch.data.house : false
      
      // Берем первую подсказку для анализа
      const firstSuggestion = suggestions[0]
      
      return {
        ...testCase,
        actual: hasHouse,
        passed: testCase.expected === hasHouse,
        dadataResponse: firstSuggestion ? {
          value: firstSuggestion.value,
          house: firstSuggestion.data.house,
          street: firstSuggestion.data.street,
          city: firstSuggestion.data.city,
          settlement: firstSuggestion.data.settlement,
          suggestions_count: suggestions.length
        } : null,
        error: null
      }
    } catch (error) {
      return {
        ...testCase,
        actual: false,
        passed: false,
        error: error.message,
        dadataResponse: null
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    
    const testResults = []
    for (const testCase of testCases) {
      const result = await testWithDadata(testCase)
      testResults.push(result)
      
      // Небольшая задержка чтобы не превысить лимиты DaData
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setResults(testResults)
    setIsRunning(false)
    setCurrentTest(null)
  }

  const clearResults = () => {
    setResults([])
    setCurrentTest(null)
  }

  const updateToken = (e) => {
    setDadataToken(e.target.value)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Тесты валидации адресов с DaData</h1>
      
      {/* Настройки */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <label className="block text-sm font-medium mb-2">
          DaData Token:
          <input
            type="text"
            value={dadataToken}
            onChange={updateToken}
            placeholder="Введите токен DaData"
            className="mt-1 block w-full px-3 py-2 border rounded-md"
          />
        </label>
        <p className="text-xs text-gray-600">
          Токен можно взять в настройках DaData: https://dadata.ru/api/#suggest
        </p>
      </div>

      {/* Управление */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning || !dadataToken}
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
          <p className="text-xs text-gray-600">Город: {currentTest.city}</p>
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
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{result.address}</p>
                  <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                  <p className="text-xs text-gray-600">Город: {result.city}</p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-semibold ${
                  result.passed 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </div>
              </div>
              
              <div className="text-sm mb-2">
                <span className="mr-4">
                  Ожидается: <strong>{result.expected ? '✓' : '✗'}</strong>
                </span>
                <span className="mr-4">
                  Фактически: <strong>{result.actual ? '✓' : '✗'}</strong>
                </span>
                <span className="mr-4">
                  Цифры в строке: <strong>{/\d/.test(result.address) ? '✓' : '✗'}</strong>
                </span>
              </div>

              {result.error && (
                <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                  Ошибка: {result.error}
                </div>
              )}

              {result.dadataResponse && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <p><strong>Ответ DaData:</strong></p>
                  <p>Значение: {result.dadataResponse.value}</p>
                  <p>Улица: {result.dadataResponse.street || 'не определено'}</p>
                  <p>Дом: {result.dadataResponse.house || 'не определено'}</p>
                  <p>Город: {result.dadataResponse.city || result.dadataResponse.settlement || 'не определено'}</p>
                  <p>Всего подсказок: {result.dadataResponse.suggestions_count}</p>
                </div>
              )}
            </div>
          ))}

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Статистика:</h3>
            <div className="text-sm">
              <p>Всего тестов: {results.length}</p>
              <p>Пройдено: {results.filter(r => r.passed).length}</p>
              <p>Провалено: {results.filter(r => !r.passed).length}</p>
              <p>Успешность: {Math.round((results.filter(r => r.passed).length / results.length) * 100)}%</p>
              <p>Ошибок API: {results.filter(r => r.error).length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Тестовые случаи */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Все тестовые случаи:</h2>
        <div className="grid grid-cols-1 gap-2 text-sm">
          {testCases.map((test, index) => (
            <div key={index} className="p-3 border rounded">
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold">{test.address}</span>
                  <span className="text-gray-600 ml-2">({test.city})</span>
                </div>
                <div>
                  <span className="text-gray-600 mr-2">{test.description}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    test.expected 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {test.expected ? 'VALID' : 'INVALID'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DadataAddressTest
