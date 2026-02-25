import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import axios from 'axios' // Import axios

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// --- TAMBAHKAN INI: INTERCEPTOR ---
// Setiap kali kita kirim request ke Backend
axios.interceptors.request.use(
  (config) => {
    // Ambil token dari LocalStorage
    const token = localStorage.getItem('access_token')

    // Kalau ada token, tempel di header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
// ------------------------------

app.mount('#app')