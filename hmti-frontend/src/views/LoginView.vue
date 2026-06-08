<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// --- TAMBAHAN LOGIKA TEMA (Agar selaras dengan HomeView) ---
const isDarkMode = computed(() => themeStore.isDarkMode)
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      textMuted: 'text-blue-200/70',
      cardGlass: 'bg-slate-800/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-blue-900/40',
      inputBg: 'bg-white/5 border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500 focus:bg-white/10',
      dropdownBg: 'bg-slate-900 border border-white/10 text-white',
      dropdownHover: 'hover:bg-blue-600/30 hover:text-white',
      btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40',
      errorBg: 'bg-red-500/20 border-red-500/50 text-red-200',
    }
  } else {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      cardGlass: 'bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl',
      inputBg: 'bg-white/50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white',
      dropdownBg: 'bg-white border border-slate-200 text-slate-800 shadow-lg',
      dropdownHover: 'hover:bg-blue-50 hover:text-blue-700',
      btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40',
      errorBg: 'bg-red-100 border-red-200 text-red-700',
    }
  }
})

// --- LOGIKA LOGIN ASLI (Tidak Diubah) ---
const loginData = ref({
  nia: '',
  password: ''
})

const errorMessage = ref('')
const showPassword = ref(false)
const showHistory = ref(false) 

const niaRef = ref(null)
const passRef = ref(null)
const historyList = ref([]) 

onMounted(() => {
  const savedHistory = localStorage.getItem('hmti_login_history')
  if (savedHistory) {
    historyList.value = JSON.parse(savedHistory)
  }
})

const focusPassword = () => {
  showHistory.value = false 
  passRef.value?.focus()
}

const handleNiaKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusPassword()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    focusPassword()
  }
}

const handlePassKeydown = (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    niaRef.value?.focus()
  }
}

const handleLogin = async () => {
  // Reset error
  errorMessage.value = ''
  
  const success = await authStore.login(loginData.value)
  
  if (success) {
    addToHistory(loginData.value.nia)
    router.push('/admin') 
  } else {
    errorMessage.value = 'NIA atau Password salah!'
  }
}

const addToHistory = (nia) => {
  if (!nia) return
  const index = historyList.value.indexOf(nia)
  if (index > -1) {
    historyList.value.splice(index, 1)
  }
  historyList.value.unshift(nia)
  if (historyList.value.length > 5) {
    historyList.value.pop()
  }
  localStorage.setItem('hmti_login_history', JSON.stringify(historyList.value))
}

const selectHistory = (nia) => {
  loginData.value.nia = nia
  showHistory.value = false
  passRef.value?.focus() 
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <!-- Latar Belakang Utama (Sama dengan HomeView) -->
  <div :class="['min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500', themeClasses.bg]">
    
    <!-- BACKGROUND ANIMATION (ORB) -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div :class="[
        'absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob transition-colors duration-500',
        isDarkMode ? 'bg-blue-600' : 'bg-blue-300'
      ]"></div>
      <div :class="[
        'absolute bottom-0 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 transition-colors duration-500',
        isDarkMode ? 'bg-indigo-600' : 'bg-indigo-300'
      ]"></div>
    </div>

    <!-- THEME TOGGLE (Pojok Kanan Atas) -->
    <button @click="themeStore.toggleTheme()" 
      class="absolute top-6 right-6 z-50 p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 border"
      :class="isDarkMode ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20' : 'bg-white/80 border-slate-300 text-slate-600 hover:bg-slate-200 shadow-lg'"
    >
      <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>

    <!-- KARTU LOGIN (GLASSMORPHISM) -->
    <div :class="['w-full max-w-md z-10 relative p-8 rounded-3xl transition-all duration-500', themeClasses.cardGlass]">
      
      <!-- Header Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30 mb-4 transform hover:rotate-3 transition-transform">
          H
        </div>
        <h2 :class="['text-3xl font-extrabold tracking-tight', themeClasses.text]">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">HMTI</span> Login
        </h2>
        <p :class="['text-sm mt-2', themeClasses.textMuted]">Silakan masuk untuk mengelola sistem.</p>
      </div>
      
      <!-- Pesan Error -->
      <div v-if="errorMessage" 
           :class="['mb-6 text-center font-bold p-3 rounded-xl border flex items-center justify-center gap-2 animate-pulse', themeClasses.errorBg]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="space-y-6 relative">
          
          <!-- INPUT NIA (Dengan Dropdown History) -->
          <div class="relative z-20">
            <label :class="['block text-sm font-bold mb-2 ml-1', themeClasses.textMuted]">Nomor Induk Anggota</label>
            
            <div class="relative group">
              <input 
                ref="niaRef"
                v-model="loginData.nia" 
                type="text" 
                autocomplete="off" 
                @focus="showHistory = true"
                @keydown="handleNiaKeydown"
                :class="['w-full rounded-xl px-4 py-3 outline-none transition-all duration-300 border', themeClasses.inputBg]"
                placeholder="Contoh: HMTI-002"
              >
              <!-- Icon User -->
              <div class="absolute right-4 top-3.5 opacity-40 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <!-- DROPDOWN CUSTOM HISTORY (Floating Glass Menu) -->
            <transition 
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95 -translate-y-2"
              enter-to-class="transform opacity-100 scale-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="transform opacity-100 scale-100 translate-y-0"
              leave-to-class="transform opacity-0 scale-95 -translate-y-2"
            >
              <ul 
                v-if="showHistory && historyList.length > 0"
                :class="['absolute left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-48 overflow-y-auto z-50', themeClasses.dropdownBg]"
              >
                <li 
                  v-for="(nia, index) in historyList" 
                  :key="index"
                  @click="selectHistory(nia)"
                  :class="['px-4 py-3 cursor-pointer flex justify-between items-center transition-colors', themeClasses.dropdownHover]"
                >
                  <span class="font-medium">{{ nia }}</span>
                  <span :class="['text-xs px-2 py-0.5 rounded border', isDarkMode ? 'border-white/20 text-gray-400' : 'border-slate-200 text-slate-500']">
                    History
                  </span>
                </li>
              </ul>
            </transition>
          </div>

          <!-- INPUT PASSWORD -->
          <div>
            <label :class="['block text-sm font-bold mb-2 ml-1', themeClasses.textMuted]">Password</label>
            <div class="relative">
              <input 
                ref="passRef"
                v-model="loginData.password" 
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                @keydown="handlePassKeydown"
                :class="['w-full rounded-xl px-4 py-3 outline-none transition-all duration-300 border pr-12', themeClasses.inputBg]"
                placeholder="••••••••"
              >
              
              <button 
                type="button" 
                @click="togglePassword"
                class="absolute right-4 top-3.5 opacity-50 hover:opacity-100 transition-opacity focus:outline-none"
                :class="isDarkMode ? 'text-blue-200' : 'text-slate-600'"
              >
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- BUTTON LOGIN -->
          <button 
            type="submit"
            :class="['w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r', themeClasses.btnGradient]"
          >
            MASUK SISTEM
          </button>
        </div>
      </form>
      
      <div class="mt-8 text-center">
        <p :class="['text-sm', themeClasses.textMuted]">
          Lupa akses? Hubungi <span class="font-bold cursor-pointer hover:underline" :class="isDarkMode ? 'text-blue-300' : 'text-blue-600'">Ketua Umum</span>.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
/* Animasi Blob dari HomeView (Duplicated untuk login page agar mandiri) */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 10s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
</style>