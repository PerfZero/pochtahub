import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
}

export const tariffsAPI = {
  getCompanies: () => api.get('/tariffs/companies/'),
  calculate: (data) => api.post('/tariffs/calculate/', data),
  analyzeImage: (formData) => api.post('/tariffs/analyze-image/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getDeliveryPoints: (params) => api.get('/tariffs/delivery-points/', { params }),
}

export const ordersAPI = {
  getOrders: () => api.get('/orders/'),
  createOrder: (data) => api.post('/orders/', data),
  getOrder: (id) => api.get(`/orders/${id}/`),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
}

export const paymentAPI = {
  createPayment: (orderId) => api.post('/payment/create/', { order_id: orderId }),
  getPayment: (id) => api.get(`/payment/${id}/`),
}

export const usersAPI = {
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
}

export default api

