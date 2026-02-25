import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Ambil Token (sudah ada)
    token: localStorage.getItem('access_token') || null,
    
    // --- PERBAIKAN: Ambil Data User dari LocalStorage juga ---
    // Kalau tidak ada, beri null
    user: JSON.parse(localStorage.getItem('hmti_user_data') || 'null'), 
    
    toast: { show: false, message: '', type: 'success' }
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async login(cred) {
      try {
        const response = await axios.post('http://localhost:3000/auth/login', cred)
        this.token = response.data.access_token
        this.user = response.data.user
        
        // Simpan Token
        localStorage.setItem('access_token', this.token)
        
        // --- PERBAIKAN: Simpan Data User juga ---
        localStorage.setItem('hmti_user_data', JSON.stringify(this.user))
        
        return true
      } catch (error) {
        console.error('Login Gagal:', error)
        return false
      }
    },

    logout() {
      this.token = null
      this.user = null
      
      // Hapus Token
      localStorage.removeItem('access_token')
      
      // --- PERBAIKAN: Hapus Data User juga ---
      localStorage.removeItem('hmti_user_data')
    },

    showToast(msg, type = 'success') {
      this.toast = { show: true, message: msg, type }
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    }
  }
})