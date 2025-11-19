import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import CalculatePage from './pages/CalculatePage'
import OrderPage from './pages/OrderPage'
import ConfirmationPage from './pages/ConfirmationPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CabinetPage from './pages/CabinetPage'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<RegisterPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/calculate" element={<CalculatePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
        <Route 
          path="/cabinet" 
          element={isAuthenticated ? <CabinetPage /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/calculate" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
