import axios from 'axios'

// Base URL API: diambil dari VITE_API_BASE_URL saat build.
// Di produksi default ke '/api' (same-origin, diproksi Nginx ke backend)
// sehingga tidak perlu CORS dan port backend tidak perlu diekspos.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const http = axios.create({
  baseURL: API_BASE_URL,
})

// Lampirkan token JWT ke setiap request secara otomatis.
// Sumber kebenaran token = localStorage ('access_token', lihat stores/auth.js)
// agar endpoint terproteksi (mis. PATCH/DELETE /members) tidak balik 401.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default http
