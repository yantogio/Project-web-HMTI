<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AnimatedBackground from '../components/AnimatedBackground.vue'
import BrandLogo from '../components/BrandLogo.vue'
import axios from 'axios'

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
      bg: 'bg-cream',
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      cardGlass: 'bg-white/90 backdrop-blur-xl border border-amber-200/80 shadow-xl shadow-amber-100/50',
      inputBg: 'bg-white border-primary-blue/40 text-stone-900 placeholder-stone-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15 focus:bg-white',
      dropdownBg: 'bg-white border border-amber-200 text-stone-800 shadow-lg',
      dropdownHover: 'hover:bg-primary-blue/5 hover:text-primary-blue',
      btnGradient: 'from-accent-orange to-accent-orange-dark hover:from-accent-orange-light hover:to-accent-orange hover:shadow-accent-orange/40',
      errorBg: 'bg-red-50 border-red-200 text-red-700',
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
  fetchKetum()
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

// --- KETUA UMUM WHATSAPP ---
const ketumMember = ref(null)

const ketumWhatsappUrl = computed(() => {
  if (!ketumMember.value?.phone) return null
  // wa.me butuh format internasional tanpa + (628xxx), normalisasi dari format apapun di DB
  let phone = ketumMember.value.phone.trim().replace(/[\s\-\(\)\.]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  else if (phone.startsWith('0')) phone = '62' + phone.slice(1)
  const msg = encodeURIComponent('Halo Ketua Umum HMTI 😊, saya ingin bertanya mengenai HMTI Universitas Bani Saleh.')
  return `https://wa.me/${phone}?text=${msg}`
})

const openKetumWhatsapp = () => {
  if (ketumWhatsappUrl.value) {
    window.open(ketumWhatsappUrl.value, '_blank', 'noopener,noreferrer')
  }
}

const fetchKetum = async () => {
  try {
    const res = await axios.get('http://localhost:3000/members')
    const candidates = res.data
      .filter(m => m.role === 'ketum' && m.status === 'Aktif' && m.phone)
      .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
    ketumMember.value = candidates[0] || null
  } catch (e) {
    // fail silently — tombol hanya disabled jika tidak ada data
  }
}
</script>

<template>
  <div :class="['min-h-screen flex relative overflow-x-hidden overflow-y-auto transition-colors duration-500', themeClasses.bg]">

    <!-- ===== BACKGROUND LAYER ===== -->
    <AnimatedBackground :isDarkMode="isDarkMode" />

    <!-- ===== BACK TO HOME ===== -->
    <button
      @click="router.push('/')"
      class="fixed top-4 left-4 md:top-6 md:left-6 z-50 p-2.5 md:p-3 px-3.5 md:px-4 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 border flex items-center gap-2 group"
      :class="isDarkMode
        ? 'bg-white/10 border-white/20 text-blue-200 hover:bg-white/20'
        : 'bg-white/80 border-amber-200 text-stone-600 hover:bg-amber-50 shadow-md'"
      title="Kembali ke Beranda"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m7 7H3" />
      </svg>
      <span class="hidden md:inline text-xs font-bold uppercase tracking-wider">Beranda</span>
    </button>

    <!-- ===== THEME TOGGLE ===== -->
    <button
      @click="themeStore.toggleTheme()"
      class="fixed top-4 right-4 md:top-6 md:right-6 z-50 p-2.5 md:p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 border"
      :class="isDarkMode
        ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20'
        : 'bg-white/80 border-amber-200 text-stone-600 hover:bg-amber-50 shadow-md'"
    >
      <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>

    <!-- ===== LEFT BRANDING PANEL (Desktop Only) ===== -->
    <div
      class="hidden lg:flex w-[46%] xl:w-1/2 min-h-screen relative flex-col items-center justify-center p-12 xl:p-16 overflow-hidden left-enter"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-primary-blue via-primary-blue-dark to-[#0d4ca8]'"
    >
      <!-- Panel decoration layer -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <!-- Slowly rotating outer ring -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 animate-spin-slow"></div>
        <!-- Counter-rotating inner ring -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/10"
          style="animation: spinSlow 14s linear infinite reverse;"></div>
        <!-- Third smallest ring static -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-white/8"></div>
        <!-- Dot grid -->
        <div class="absolute inset-0 opacity-[0.07]"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px); background-size: 30px 30px;"></div>
        <!-- Glow blobs -->
        <div class="absolute top-12 right-12 w-52 h-52 rounded-full bg-white/5 blur-3xl animate-pulse-slow"></div>
        <div class="absolute bottom-20 left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl animate-pulse-slow animation-delay-2000"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/3 blur-3xl animate-pulse-slow animation-delay-1000"></div>
        <!-- Corner accent shapes -->
        <div class="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-white/10 rounded-tl-3xl"></div>
        <div class="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-white/10 rounded-br-3xl"></div>
      </div>

      <!-- HMTI Emblem -->
      <div class="relative mb-10 z-10">
        <BrandLogo variant="emblem" :isDarkMode="isDarkMode" />
      </div>

      <!-- Title block -->
      <div class="text-center mb-12 relative z-10">
        <h1 class="text-4xl xl:text-5xl font-black text-white tracking-tight mb-3 leading-tight">
          HMTI Portal
        </h1>
        <p class="text-white/55 text-base xl:text-lg font-light tracking-wide">Himpunan Mahasiswa Teknik Informatika</p>
        <!-- Decorative divider -->
        <div class="mt-6 flex items-center justify-center gap-2">
          <div class="h-px w-10 bg-white/25 rounded-full"></div>
          <div class="w-2 h-2 rounded-full bg-white/40"></div>
          <div class="h-px w-10 bg-white/25 rounded-full"></div>
        </div>
      </div>

      <!-- Feature Cards (staggered float) -->
      <div class="space-y-3 w-full max-w-xs xl:max-w-sm relative z-10">
        <div
          class="flex items-center gap-4 p-4 xl:p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/17 transition-all duration-300 hover:translate-x-1 animate-float"
          style="animation-delay: 0s; animation-duration: 5.5s;"
        >
          <div class="w-11 h-11 xl:w-12 xl:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shrink-0 shadow-inner">👥</div>
          <div>
            <div class="text-white font-semibold text-sm xl:text-base leading-tight">Kelola Anggota</div>
            <div class="text-white/45 text-xs mt-0.5">Data & status keanggotaan</div>
          </div>
          <div class="ml-auto text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div
          class="flex items-center gap-4 p-4 xl:p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/17 transition-all duration-300 hover:translate-x-1 animate-float-r"
          style="animation-delay: 0.6s; animation-duration: 6s;"
        >
          <div class="w-11 h-11 xl:w-12 xl:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shrink-0 shadow-inner">💰</div>
          <div>
            <div class="text-white font-semibold text-sm xl:text-base leading-tight">Transparansi Keuangan</div>
            <div class="text-white/45 text-xs mt-0.5">Laporan & iuran anggota</div>
          </div>
          <div class="ml-auto text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div
          class="flex items-center gap-4 p-4 xl:p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/17 transition-all duration-300 hover:translate-x-1 animate-float"
          style="animation-delay: 1.2s; animation-duration: 7s;"
        >
          <div class="w-11 h-11 xl:w-12 xl:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shrink-0 shadow-inner">📄</div>
          <div>
            <div class="text-white font-semibold text-sm xl:text-base leading-tight">Dokumen & Portofolio</div>
            <div class="text-white/45 text-xs mt-0.5">Arsip dan prestasi HMTI</div>
          </div>
          <div class="ml-auto text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Bottom copyright -->
      <div class="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <span class="text-white/22 text-xs font-light tracking-widest uppercase">© 2025 HMTI · All rights reserved</span>
      </div>
    </div>

    <!-- ===== RIGHT FORM PANEL ===== -->
    <div class="w-full lg:w-[54%] xl:w-1/2 min-h-screen flex items-center justify-center px-4 py-20 md:p-12 xl:p-16 relative z-10">
      <div class="w-full max-w-md">

        <!-- Mobile branding (hidden on desktop) -->
        <div class="lg:hidden text-center mb-6">
          <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4 animate-float"
            style="animation-duration: 5s;"
            :class="isDarkMode
              ? 'bg-gradient-to-br from-indigo-600 to-blue-700'
              : 'bg-gradient-to-br from-primary-blue to-primary-blue-dark'">
            H
          </div>
          <h2 :class="['text-2xl font-black tracking-tight', themeClasses.text]">HMTI Portal</h2>
          <p :class="['text-sm mt-1 font-light', themeClasses.textMuted]">Himpunan Mahasiswa Teknik Informatika</p>
        </div>

        <!-- ===== FORM CARD ===== -->
        <div :class="['p-6 sm:p-8 xl:p-10 rounded-3xl transition-all duration-500 login-enter', themeClasses.cardGlass]">

          <!-- Card Header -->
          <div class="mb-6 md:mb-8">
            <div class="flex items-start gap-4 mb-5">
              <!-- Desktop inline logo -->
              <div class="hidden lg:flex w-12 h-12 rounded-xl items-center justify-center text-white text-xl font-black shadow-md shrink-0 mt-0.5"
                :class="isDarkMode
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                  : 'bg-gradient-to-br from-primary-blue to-primary-blue-dark'">
                H
              </div>
              <div>
                <h2 :class="['text-2xl xl:text-3xl font-extrabold leading-tight mb-1', themeClasses.text]">
                  Selamat Datang
                </h2>
                <p :class="['text-sm font-light leading-relaxed', themeClasses.textMuted]">
                  Masuk ke sistem manajemen anggota HMTI
                </p>
              </div>
            </div>
            <!-- Divider -->
            <div class="h-px w-full rounded-full" :class="isDarkMode ? 'bg-white/10' : 'bg-amber-200/60'"></div>
          </div>

          <!-- Error Message -->
          <transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div v-if="errorMessage"
              :class="['mb-5 p-3.5 rounded-xl border flex items-center gap-3 text-sm font-medium', themeClasses.errorBg]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ errorMessage }}
            </div>
          </transition>

          <form @submit.prevent="handleLogin">
            <div class="space-y-5 relative">

              <!-- ===== NIA INPUT ===== -->
              <div class="relative z-20">
                <label :class="['block text-xs font-bold uppercase tracking-widest mb-2.5', themeClasses.textMuted]">
                  Nomor Induk Anggota
                </label>
                <div class="relative group">
                  <!-- Left icon -->
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                    :class="isDarkMode ? 'text-blue-400/50' : 'text-primary-blue/50'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <input
                    ref="niaRef"
                    v-model="loginData.nia"
                    type="text"
                    autocomplete="off"
                    @focus="showHistory = true"
                    @keydown="handleNiaKeydown"
                    :class="['w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all duration-300 border', themeClasses.inputBg]"
                    placeholder="Contoh: HMTI-002"
                  >
                </div>

                <!-- DROPDOWN HISTORY -->
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
                      :class="['px-4 py-3 cursor-pointer flex justify-between items-center transition-colors text-sm', themeClasses.dropdownHover]"
                    >
                      <div class="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-medium">{{ nia }}</span>
                      </div>
                      <span :class="['text-xs px-2 py-0.5 rounded border', isDarkMode ? 'border-white/20 text-gray-400' : 'border-stone-200 text-stone-400']">
                        Riwayat
                      </span>
                    </li>
                  </ul>
                </transition>
              </div>

              <!-- ===== PASSWORD INPUT ===== -->
              <div>
                <label :class="['block text-xs font-bold uppercase tracking-widest mb-2.5', themeClasses.textMuted]">
                  Password
                </label>
                <div class="relative">
                  <!-- Left icon -->
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    :class="isDarkMode ? 'text-blue-400/50' : 'text-primary-blue/50'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    ref="passRef"
                    v-model="loginData.password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    @keydown="handlePassKeydown"
                    :class="['w-full rounded-xl pl-12 pr-12 py-3.5 outline-none transition-all duration-300 border', themeClasses.inputBg]"
                    placeholder="••••••••"
                  >
                  <!-- Toggle password visibility -->
                  <button
                    type="button"
                    @click="togglePassword"
                    class="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity focus:outline-none"
                    :class="isDarkMode ? 'text-blue-200' : 'text-stone-600'"
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

              <!-- ===== LOGIN BUTTON ===== -->
              <button
                type="submit"
                :class="['w-full text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 bg-gradient-to-r group', themeClasses.btnGradient]"
              >
                <span class="flex items-center justify-center gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  MASUK SISTEM
                </span>
              </button>

            </div>
          </form>

          <!-- Card Footer -->
          <div class="mt-7 pt-6 border-t text-center" :class="isDarkMode ? 'border-white/10' : 'border-amber-200/50'">
            <p :class="['text-sm', themeClasses.textMuted]">
              Lupa akses? Hubungi
              <button
                @click="openKetumWhatsapp"
                :disabled="!ketumWhatsappUrl"
                class="font-semibold ml-1 transition-colors inline-flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                :class="isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'"
                :title="ketumWhatsappUrl ? 'Chat via WhatsApp' : 'Nomor belum tersedia'"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Ketua Umum
              </button>
            </p>
          </div>
        </div>

        <!-- Bottom watermark -->
        <p :class="['text-center text-xs mt-5 font-light opacity-40', themeClasses.text]">
          HMTI © 2025 — Sistem Portal Manajemen Anggota
        </p>

      </div>
    </div>

  </div>
</template>

