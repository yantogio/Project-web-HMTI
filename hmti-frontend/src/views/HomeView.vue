<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useThemeStore } from '../stores/theme'
import AnimatedBackground from '../components/AnimatedBackground.vue'
import BrandLogo from '../components/BrandLogo.vue'

const router = useRouter()
const themeStore = useThemeStore()
const isDarkMode = computed(() => themeStore.isDarkMode)

const isHeaderVisible = ref(true)
const lastScrollY = ref(0)
const scrollThreshold = 8

const handleScroll = () => {
  const currentScrollY = window.scrollY

  if (currentScrollY <= 0) {
    isHeaderVisible.value = true
  } else if (currentScrollY > lastScrollY.value + scrollThreshold) {
    isHeaderVisible.value = false
  } else if (currentScrollY < lastScrollY.value - scrollThreshold) {
    isHeaderVisible.value = true
  }

  lastScrollY.value = currentScrollY
}

const officers = ref([])
const isLoading = ref(true)
const activities = ref([])
const achievements = ref([])

// Carousel
const currentSlide = ref(0)
const slideInterval = ref(null)
const isPaused = ref(false)

const nextSlide = () => {
  if (officers.value.length === 0) return
  currentSlide.value = (currentSlide.value + 1) % officers.value.length
}
const prevSlide = () => {
  if (officers.value.length === 0) return
  currentSlide.value = (currentSlide.value - 1 + officers.value.length) % officers.value.length
}
const goToSlide = (index) => { currentSlide.value = index }

const startAutoPlay = () => {
  stopAutoPlay()
  slideInterval.value = setInterval(() => {
    if (!isPaused.value && officers.value.length > 0) nextSlide()
  }, 4000)
}
const stopAutoPlay = () => {
  if (slideInterval.value) clearInterval(slideInterval.value)
}

// Animated stats
const statsTriggered = ref(false)
const stats = ref([
  { label: 'Anggota Aktif', count: 0, target: 150, suffix: '+', icon: '👥', color: 'from-blue-400 to-blue-600' },
  { label: 'Program Kegiatan', count: 0, target: 42, suffix: '+', icon: '📅', color: 'from-purple-400 to-purple-600' },
  { label: 'Prestasi Diraih', count: 0, target: 28, suffix: '+', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
  { label: 'Tahun Berdiri', count: 0, target: 2019, suffix: '', icon: '📌', color: 'from-teal-400 to-teal-600' },
])

const animateCounter = (stat) => {
  const stepTime = 50
  const steps = 1500 / stepTime
  const increment = Math.ceil(stat.target / steps)
  let current = 0
  const timer = setInterval(() => {
    current += increment
    if (current >= stat.target) {
      stat.count = stat.target
      clearInterval(timer)
    } else {
      stat.count = current
    }
  }, stepTime)
}

// Scroll observers
let scrollObserver = null
let statsObserver = null

const setupScrollAnimations = () => {
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        const children = entry.target.querySelectorAll('.stagger-child')
        children.forEach((child, i) => {
          setTimeout(() => child.classList.add('is-visible'), i * 120)
        })
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

  document.querySelectorAll('.scroll-reveal').forEach(el => scrollObserver.observe(el))
}

const setupStatsObserver = () => {
  const el = document.getElementById('stats-section')
  if (!el) return
  statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !statsTriggered.value) {
      statsTriggered.value = true
      stats.value.forEach((stat, i) => {
        setTimeout(() => animateCounter(stat), i * 200)
      })
      statsObserver.disconnect()
    }
  }, { threshold: 0.2 })
  statsObserver.observe(el)
}

const fetchOfficers = async () => {
  try {
    isLoading.value = true
    const response = await axios.get('http://localhost:3000/members')
    const data = response.data.filter(m => m.role !== 'anggota' && m.status === 'Aktif')
    officers.value = data.map(member => ({
      ...member,
      img: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=256&font-size=0.33`
    }))
  } catch (error) {
    console.error('Gagal mengambil data pengurus:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchOfficers()
  startAutoPlay()
  await nextTick()
  setupScrollAnimations()
  setupStatsObserver()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  stopAutoPlay()
  if (scrollObserver) scrollObserver.disconnect()
  if (statsObserver) statsObserver.disconnect()
  window.removeEventListener('scroll', handleScroll)
})

const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      cardGlass: 'bg-slate-800/50 border-white/10',
      textMuted: 'text-slate-400',
      gradientText: 'from-blue-300 via-cyan-300 to-purple-300',
      inputBg: 'bg-white/10 border-white/20 text-white',
      statCard: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
      sectionAlt: 'bg-white/3',
    }
  } else {
    return {
      bg: 'bg-cream',
      text: 'text-stone-900',
      cardGlass: 'bg-white border-amber-200/70 shadow-md hover:shadow-xl hover:border-primary-blue/30',
      textMuted: 'text-stone-500',
      gradientText: 'from-primary-blue via-accent-orange to-accent-orange',
      inputBg: 'bg-white border-stone-300 text-stone-900',
      statCard: 'bg-white border-amber-200 shadow-md hover:shadow-xl hover:border-primary-blue/20',
      sectionAlt: 'bg-cream-light',
    }
  }
})

const headingGradientClass = computed(() => [
  'bg-clip-text text-transparent bg-gradient-to-r',
  themeClasses.value.gradientText
])

const achievementPlaceholders = [
  { emoji: '🥇', label: 'Juara 1 Nasional' },
  { emoji: '🏆', label: 'Best Speaker' },
  { emoji: '🎖️', label: 'Top Innovation' },
]
</script>

<template>
  <div :class="['min-h-screen transition-colors duration-500 relative overflow-x-hidden', themeClasses.bg]">

    <!-- ==================== ANIMATED BACKGROUND ==================== -->
    <AnimatedBackground :isDarkMode="isDarkMode" />

    <!-- ==================== NAVBAR ==================== -->
    <nav :class="[
      'fixed top-0 w-full z-50 transition-transform duration-300 ease-in-out will-change-transform',
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full',
      isDarkMode ? 'bg-slate-900/60 backdrop-blur-xl border-b border-white/10' : 'bg-cream-light/90 backdrop-blur-xl border-b border-amber-200 shadow-sm'
    ]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 md:h-18 items-center">

          <!-- Logo -->
          <div
            class="cursor-pointer group transition-transform duration-200 hover:scale-105 active:scale-95"
            @click="router.push('/')"
          >
            <BrandLogo size="md" :isDarkMode="isDarkMode" />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 md:gap-4">

            <button @click="themeStore.toggleTheme()" :class="[
              'p-2.5 md:p-3 rounded-full transition-all duration-300 ease-in-out shrink-0',
              'hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2',
              isDarkMode
                ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700 focus:ring-yellow-400'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400'
            ]" title="Ganti Tema">
              <span class="block transition-transform duration-500" :class="isDarkMode ? 'rotate-180' : 'rotate-0'">
                <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </span>
            </button>

            <router-link to="/login" :class="[
              'flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 transform shrink-0 whitespace-nowrap text-white',
              'hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2',
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 focus:ring-blue-500'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/25 focus:ring-blue-600'
            ]">

              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-4.5 md:w-4.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>

              <span class="hidden sm:inline">Login Anggota</span>
              <span class="sm:hidden">Login</span>

            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- ==================== MAIN CONTENT ==================== -->
    <main class="relative z-10 pt-16 md:pt-18">

      <!-- ===== HERO SECTION ===== -->
      <section class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

        <!-- Floating tech badges (desktop only) -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            :class="['absolute top-28 left-6 md:left-16 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm animate-float hidden md:flex items-center gap-1.5', isDarkMode ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700']">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Web Development
          </div>
          <div
            :class="['absolute top-44 right-6 md:right-20 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm animate-float-slow hidden md:flex items-center gap-1.5', isDarkMode ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700']">
            <span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span> AI & Machine Learning
          </div>
          <div
            :class="['absolute bottom-40 left-10 md:left-28 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm animate-float hidden md:flex items-center gap-1.5', isDarkMode ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700']">
            <span class="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span> Cybersecurity
          </div>
          <div
            :class="['absolute bottom-56 right-10 md:right-36 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm animate-float-slow hidden md:flex items-center gap-1.5', isDarkMode ? 'bg-orange-500/20 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-700']">
            <span class="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span> IoT & Embedded
          </div>
        </div>

        <div class="max-w-4xl mx-auto text-center relative z-10">

          <!-- Badge -->
          <div
            class="hero-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border backdrop-blur-sm"
            :class="isDarkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-primary-blue/10 border-primary-blue/30 text-primary-blue'">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
            Website Resmi HMTI
          </div>

          <!-- Headline -->
          <h1 class="hero-fade-up text-4xl sm:text-5xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight"
            style="animation-delay:0.12s;">
            <span :class="headingGradientClass">Official Website HMTI</span><br>
            <span :class="headingGradientClass">Universitas Bani Saleh</span>
          </h1>

          <!-- Subheadline -->
          <p class="hero-fade-up text-base md:text-xl max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed"
            :class="themeClasses.textMuted" style="animation-delay:0.24s;">
            Wadah aspirasi, kreasi, dan inovasi mahasiswa Teknik Informatika.
            Bersatu untuk kemajuan, berprestasi untuk negeri.
          </p>

          <!-- CTA Buttons -->
          <div class="hero-fade-up flex flex-col sm:flex-row justify-center gap-3 md:gap-4"
            style="animation-delay:0.36s;">
            <button @click="router.push('/login')"
              :class="['px-7 md:px-9 py-3.5 md:py-4 rounded-xl font-bold text-white text-sm md:text-base transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 active:scale-100',
                isDarkMode ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-blue-500/40' : 'bg-gradient-to-r from-accent-orange to-accent-orange-dark hover:shadow-2xl hover:shadow-accent-orange/40']">
              🚀 Gabung Sekarang
            </button>
            <button
              class="px-7 md:px-9 py-3.5 md:py-4 rounded-xl font-bold border text-sm md:text-base transition-all duration-200 transform hover:-translate-y-1"
              :class="isDarkMode ? 'border-white/20 text-white hover:bg-white/8 hover:border-white/40' : 'border-primary-blue text-primary-blue hover:bg-primary-blue/5 hover:border-primary-blue-dark'">
              📖 Pelajari Lebih Lanjut
            </button>
          </div>

          <!-- Scroll indicator -->
          <div class="hero-fade-up mt-16 flex justify-center" style="animation-delay:0.5s;">
            <div class="flex flex-col items-center gap-2 animate-bounce">
              <span :class="['text-xs font-medium', themeClasses.textMuted]">Scroll</span>
              <div
                :class="['w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5', isDarkMode ? 'border-white/30' : 'border-slate-400']">
                <div :class="['w-1 h-2.5 rounded-full', isDarkMode ? 'bg-white/60' : 'bg-slate-500']"
                  style="animation: scrollDot 1.5s ease-in-out infinite;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== STATS SECTION ===== -->
      <section id="stats-section" class="py-12 md:py-16 px-4">
        <div class="max-w-5xl mx-auto">
          <div class="scroll-reveal grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            <div v-for="(stat, i) in stats" :key="i"
              :class="['stagger-child rounded-2xl p-5 md:p-6 text-center border transition-all duration-300 cursor-default', themeClasses.statCard]">
              <div class="text-2xl md:text-3xl mb-2">{{ stat.icon }}</div>
              <div
                :class="['text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br', stat.color]">
                {{ stat.count }}{{ stat.suffix }}
              </div>
              <div :class="['text-xs md:text-sm font-semibold mt-1.5', themeClasses.textMuted]">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== PENGURUS CAROUSEL ===== -->
      <section class="py-14 md:py-20 px-4 relative overflow-hidden">
        <!-- Section tint -->
        <div :class="['absolute inset-0 -z-10 transition-colors duration-500', themeClasses.sectionAlt]"></div>
        <div
          class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent">
        </div>
        <div
          class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent">
        </div>

        <div class="text-center mb-10 md:mb-14 scroll-reveal">
          <span
            :class="['text-xs font-bold uppercase tracking-widest', isDarkMode ? 'text-blue-400' : 'text-blue-600']">Tim
            Kami</span>
          <h2 :class="['text-3xl md:text-4xl font-bold mt-2 mb-3', headingGradientClass]">Pengurus Inti</h2>
          <div class="h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <p :class="['mt-3 text-sm md:text-base', themeClasses.textMuted]">Mengenal tim yang berdedikasi untuk HMTI.
          </p>
        </div>

        <div class="relative max-w-4xl mx-auto" @mouseenter="isPaused = true" @mouseleave="isPaused = false">

          <!-- Loading state -->
          <div v-if="isLoading" class="h-56 flex flex-col items-center justify-center gap-3">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p :class="['text-sm', themeClasses.textMuted]">Memuat data pengurus...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="officers.length === 0" class="text-center py-14">
            <p :class="themeClasses.textMuted">Belum ada data pengurus yang ditampilkan.</p>
          </div>

          <!-- Slider -->
          <div v-else>
            <div class="overflow-hidden rounded-2xl">
              <div class="flex transition-transform duration-700 ease-in-out"
                :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
                <div v-for="(officer, index) in officers" :key="officer.nia" class="w-full flex-shrink-0 p-1 md:p-2">
                  <div
                    :class="['rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8 border transition-all duration-300', themeClasses.cardGlass]">

                    <!-- Avatar -->
                    <div class="relative flex-shrink-0">
                      <div
                        class="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-40 animate-pulse scale-110">
                      </div>
                      <img :src="officer.img" :alt="officer.name"
                        class="relative w-24 h-24 md:w-40 md:h-40 object-cover rounded-full border-4 shadow-xl"
                        :class="isDarkMode ? 'border-slate-700' : 'border-white'">
                    </div>

                    <!-- Info -->
                    <div class="text-center md:text-left flex-1 min-w-0">
                      <span
                        :class="['text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2', isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700']">
                        {{ officer.role }}
                      </span>
                      <h3 :class="['text-xl md:text-3xl font-bold mb-1 truncate', headingGradientClass]">{{ officer.name }}
                      </h3>
                      <p :class="['text-sm md:text-base font-medium mb-4', themeClasses.textMuted]">{{ officer.jabatan
                      }}</p>
                      <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span :class="['px-3 py-1 rounded-lg text-xs font-mono border', themeClasses.inputBg]">NIA: {{
                          officer.nia }}</span>
                        <span :class="['px-3 py-1 rounded-lg text-xs font-mono border', themeClasses.inputBg]">NPM: {{
                          officer.npm }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nav buttons -->
            <button v-if="officers.length > 1" @click="prevSlide"
              class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-6 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 hover:scale-110 z-10"
              :class="isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-lg'">
              <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button v-if="officers.length > 1" @click="nextSlide"
              class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-6 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 hover:scale-110 z-10"
              :class="isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-lg'">
              <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Dots -->
            <div class="flex justify-center gap-2 mt-5" v-if="officers.length > 1">
              <button v-for="(_, index) in officers" :key="index" @click="goToSlide(index)"
                class="h-2 rounded-full transition-all duration-300" :class="[currentSlide === index ? 'w-8' : 'w-2 hover:w-3',
                currentSlide === index
                  ? (isDarkMode ? 'bg-blue-400' : 'bg-blue-600')
                  : (isDarkMode ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-300 hover:bg-slate-400')]">
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== GALERI KEGIATAN ===== -->
      <section class="py-14 md:py-20 px-4 relative">
        <div class="max-w-7xl mx-auto">

          <div
            class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 scroll-reveal">
            <div>
              <span
                :class="['text-xs font-bold uppercase tracking-widest', isDarkMode ? 'text-teal-400' : 'text-teal-600']">Program
                Himpunan</span>
              <h2 :class="['text-2xl md:text-4xl font-bold mt-1', headingGradientClass]">Galeri Kegiatan</h2>
              <div class="h-1 w-20 bg-gradient-to-r from-teal-500 to-blue-500 mt-2 rounded-full"></div>
            </div>
            <span
              :class="['text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg border self-start md:self-auto', themeClasses.inputBg]">
              📅 Arsip Aktivitas Himpunan
            </span>
          </div>

          <!-- Empty state -->
          <div v-if="activities.length === 0"
            class="scroll-reveal text-center py-12 md:py-16 border-2 border-dashed rounded-2xl transition-colors duration-500"
            :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
            <div
              :class="['w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', isDarkMode ? 'bg-white/5' : 'bg-slate-100']">
              <svg class="h-8 w-8 opacity-40" :class="isDarkMode ? 'text-teal-400' : 'text-teal-600'" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 :class="['text-lg font-bold mb-2', headingGradientClass]">Belum Ada Kegiatan</h3>
            <p :class="['max-w-sm mx-auto text-sm', themeClasses.textMuted]">Data kegiatan himpunan belum tersedia.
              Nantikan update aktivitas terbaru kami.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Cards populated from data -->
          </div>
        </div>
      </section>

      <!-- ===== EVENT SECTION ===== -->
      <section class="py-10 md:py-16 px-4 relative overflow-hidden">
        <div :class="['absolute inset-0 -z-10 transition-colors duration-500', themeClasses.sectionAlt]"></div>
        <div
          class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent">
        </div>
        <div
          class="absolute right-0 top-1/2 -translate-y-1/2 w-48 md:w-72 h-48 md:h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none">
        </div>
        <div class="absolute left-0 bottom-0 w-36 h-36 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto">
          <div class="scroll-reveal mb-8 md:mb-10">
            <span
              :class="['text-xs font-bold uppercase tracking-widest', isDarkMode ? 'text-purple-400' : 'text-purple-600']">Upcoming</span>
            <h2 :class="['text-2xl md:text-4xl font-bold mt-1', headingGradientClass]">Event Besar</h2>
            <div class="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 mt-2 rounded-full"></div>
          </div>

          <div v-if="activities.length === 0"
            class="scroll-reveal relative rounded-2xl p-7 md:p-12 text-center overflow-hidden transition-colors duration-500"
            :class="isDarkMode ? 'bg-gradient-to-br from-purple-900/30 to-slate-900/40 border border-purple-500/20' : 'bg-white border border-purple-100 shadow-xl'">
            <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none">
            </div>
            <div class="relative z-10">
              <span class="text-4xl mb-4 block">🎉</span>
              <h3 :class="['text-xl md:text-2xl font-bold mb-2', headingGradientClass]">Tidak Ada Event Mendatang</h3>
              <p :class="['max-w-lg mx-auto text-sm md:text-base', themeClasses.textMuted]">
                Tetap pantau halaman ini untuk informasi seminar, workshop, dan kompetisi skala besar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== DINDING PRESTASI ===== -->
      <section class="py-14 md:py-20 px-4 relative">
        <div class="absolute right-10 top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none">
        </div>
        <div class="max-w-7xl mx-auto">

          <div class="text-center mb-10 md:mb-14 scroll-reveal">
            <div
              :class="['inline-flex p-3 rounded-full mb-4 border', isDarkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200']">
              <svg class="h-7 w-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 :class="['text-2xl md:text-4xl font-bold', headingGradientClass]">Dinding Prestasi</h2>
            <div class="h-1 w-20 bg-gradient-to-r from-yellow-400 to-orange-500 mt-2 mx-auto rounded-full"></div>
            <p :class="['mt-3 text-sm md:text-base', themeClasses.textMuted]">Bukti nyata dedikasi dan kerja keras
              anggota HMTI.</p>
          </div>

          <div v-if="achievements.length === 0" class="scroll-reveal grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div v-for="(item, i) in achievementPlaceholders" :key="i"
              class="stagger-child rounded-2xl p-6 md:p-8 border-2 border-dashed flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[200px] transition-all duration-300 hover:border-yellow-500/50 group cursor-default"
              :class="isDarkMode ? 'border-white/10 bg-white/3 hover:bg-white/8' : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:shadow-lg'">
              <div
                class="text-4xl md:text-5xl mb-3 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                {{ item.emoji }}
              </div>
              <span :class="['text-xs md:text-sm font-bold', isDarkMode ? 'text-slate-400' : 'text-slate-500']">{{
                item.label }}</span>
            </div>
            <div class="sm:col-span-3 text-center mt-2">
              <p :class="['text-xs italic', themeClasses.textMuted]">*Data prestasi akan ditampilkan secara otomatis
                setelah diinput.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== CTA SECTION ===== -->
      <section class="py-14 md:py-20 px-4 relative overflow-hidden">
        <div
          :class="['absolute inset-0 -z-10', isDarkMode ? 'bg-gradient-to-br from-blue-900/25 via-indigo-900/15 to-purple-900/25' : 'bg-gradient-to-br from-blue-50 via-indigo-50/80 to-purple-50']">
        </div>
        <div
          class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent">
        </div>
        <div class="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none">
        </div>
        <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none">
        </div>

        <div class="max-w-3xl mx-auto text-center scroll-reveal">
          <h2 :class="['text-2xl md:text-4xl font-extrabold mb-4', headingGradientClass]">
            Siap Bergabung dengan HMTI?
          </h2>
          <p :class="['mb-8 text-sm md:text-base max-w-xl mx-auto', themeClasses.textMuted]">
            Jadilah bagian dari komunitas mahasiswa Teknik Informatika yang inovatif dan berprestasi.
          </p>
          <button @click="router.push('/login')"
            :class="['px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-bold text-white text-sm md:text-base transition-all duration-200 transform hover:-translate-y-1 hover:scale-105',
              isDarkMode ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-blue-500/30' : 'bg-gradient-to-r from-accent-orange to-accent-orange-dark hover:shadow-2xl hover:shadow-accent-orange/30']">
            Daftar Sekarang →
          </button>
        </div>
      </section>

      <!-- ===== FOOTER ===== -->
      <footer
        :class="['py-8 md:py-10 border-t backdrop-blur-sm transition-colors duration-500', isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-cream-light/90 border-amber-200']">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                H</div>
              <span :class="['font-bold text-sm', headingGradientClass]">HMTI Universitas Bani
                Saleh</span>
            </div>
            <p :class="['text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-400']">
              &copy; 2026 HMTI System. Built with Vue 3 & Tailwind CSS.
            </p>
            <div class="flex gap-5">
              <router-link to="/login"
                :class="['text-xs font-medium transition-colors', isDarkMode ? 'text-slate-500 hover:text-blue-300' : 'text-slate-400 hover:text-blue-600']">Login</router-link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  </div>
</template>
