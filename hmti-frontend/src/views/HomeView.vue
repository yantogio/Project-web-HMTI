<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useThemeStore } from '../stores/theme'
import AnimatedBackground from '../components/AnimatedBackground.vue'
import BrandLogo from '../components/BrandLogo.vue'

const router = useRouter()
const themeStore = useThemeStore()
const isDarkMode = computed(() => themeStore.isDarkMode)

const BASE = 'http://localhost:3000'
// Pola sama seperti getDocPreviewUrl di ShowcaseHub — gunakan NIA sebagai identifier
const getAvatarUrl = (nia, avatarUrl) => {
  if (!avatarUrl || !nia) return null
  const qs = avatarUrl.includes('?') ? avatarUrl.slice(avatarUrl.indexOf('?')) : ''
  return `${BASE}/members/${nia}/avatar${qs}`
}

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
const events = ref([])
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

// Stats: total anggota dari API + link sosmed
const statsTriggered = ref(false)
const totalMembers = ref(0)
const totalMembersCount = ref(0)

// Ketum untuk WhatsApp
const ketumMember = ref(null)

const ketumWhatsappUrl = computed(() => {
  if (!ketumMember.value?.phone) return null
  // wa.me butuh format internasional tanpa + (628xxx), normalisasi dari format apapun di DB
  let phone = ketumMember.value.phone.trim().replace(/[\s\-\(\)\.]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  else if (phone.startsWith('0')) phone = '62' + phone.slice(1)
  const msg = encodeURIComponent('Halo Ketua Umum HMTI, saya ingin bertanya mengenai HMTI Universitas Bani Saleh.')
  return `https://wa.me/${phone}?text=${msg}`
})

const openKetumWhatsapp = () => {
  if (ketumWhatsappUrl.value) {
    window.open(ketumWhatsappUrl.value, '_blank', 'noopener,noreferrer')
  }
}

const animateTotalMembers = () => {
  const target = totalMembers.value
  if (target === 0) { totalMembersCount.value = 0; return }
  const stepTime = 40
  const duration = 1400
  const steps = duration / stepTime
  const increment = Math.ceil(target / steps)
  let current = 0
  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      totalMembersCount.value = target
      clearInterval(timer)
    } else {
      totalMembersCount.value = current
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
      animateTotalMembers()
      statsObserver.disconnect()
    }
  }, { threshold: 0.2 })
  statsObserver.observe(el)
}

const getDocMediaUrl = (documentId) => {
  if (!documentId) return null
  return `http://localhost:3000/documents/preview/${documentId}`
}

// --- PREVIEW MODAL STATE ---
const selectedItem = ref(null)
const previewVideoEl = ref(null)

const previewRenderType = computed(() => {
  const cat = selectedItem.value?.document?.category
  if (!cat) return 'img'
  return cat.startsWith('video/') ? 'video' : 'img'
})

const openItemPreview = (item) => {
  if (!item.document?.id) return
  selectedItem.value = item
}

const closeItemPreview = () => {
  if (previewVideoEl.value) {
    previewVideoEl.value.pause()
    previewVideoEl.value.src = ''
    previewVideoEl.value.load()
  }
  selectedItem.value = null
}

// --- DIRECTIVE: autoplay video saat masuk viewport, pause saat keluar ---
const vAutoplayOnVisible = {
  mounted(el) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    el._autoplayObserver = observer
  },
  unmounted(el) {
    if (el._autoplayObserver) {
      el._autoplayObserver.disconnect()
      delete el._autoplayObserver
    }
  }
}

const formatDate = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const fetchShowcaseActive = async () => {
  try {
    const res = await axios.get('http://localhost:3000/showcase/active')
    const all = res.data
    activities.value = all.filter(i => i.category === 'kegiatan')
    events.value = all.filter(i => i.category === 'event')
    achievements.value = all.filter(i => i.category === 'prestasi')
  } catch (e) {
    console.error('Gagal memuat showcase:', e)
  }
}

const fetchOfficers = async () => {
  try {
    isLoading.value = true
    const response = await axios.get('http://localhost:3000/members')
    const all = response.data

    // Total anggota dari database
    totalMembers.value = all.length

    // Cari ketum aktif dengan nomor HP, ambil yang paling baru dibuat
    const ketumCandidates = all
      .filter(m => m.role === 'ketum' && m.status === 'Aktif' && m.phone)
      .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
    ketumMember.value = ketumCandidates[0] || null

    // Officer carousel: role selain anggota dan aktif
    const data = all.filter(m => m.role !== 'anggota' && m.status === 'Aktif')
    officers.value = data.map(member => ({
      ...member,
      img: getAvatarUrl(member.nia, member.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=256&font-size=0.33`
    }))
  } catch (error) {
    console.error('Gagal mengambil data pengurus:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchOfficers(), fetchShowcaseActive()])
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
  'bg-clip-text text-transparent bg-gradient-to-r py-1',
  themeClasses.value.gradientText
])

const achievementPlaceholders = [
  { emoji: '🥇', label: 'Juara 1 Nasional' },
  { emoji: '🏆', label: 'Best Speaker' },
  { emoji: '🎖️', label: 'Top Innovation' },
]

// --- OFFICER PROFILE POPUP ---
const selectedOfficer = ref(null)
const isOfficerProfileOpen = ref(false)

const openOfficerProfile = (officer) => {
  selectedOfficer.value = officer
  isOfficerProfileOpen.value = true
}

const closeOfficerProfile = () => {
  isOfficerProfileOpen.value = false
  selectedOfficer.value = null
}

watch(isDarkMode, async () => {
  await nextTick()
  document.querySelectorAll('.scroll-reveal, .stagger-child').forEach(el => {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight + 100 && rect.bottom >= 0) {
      el.classList.add('is-visible')
    }
  })
})
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
          <h1 class="hero-fade-up text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 tracking-tight leading-[1.15]"
            style="animation-delay:0.12s;">
            <span :class="['block', ...headingGradientClass]">Official Website HMTI</span>
            <span :class="['block', ...headingGradientClass]">Universitas Bani Saleh</span>
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
              @click="openKetumWhatsapp"
              class="px-7 md:px-9 py-3.5 md:py-4 rounded-xl font-bold border text-sm md:text-base transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
              :class="[isDarkMode ? 'border-white/20 text-white hover:bg-white/8 hover:border-white/40' : 'border-primary-blue text-primary-blue hover:bg-primary-blue/5 hover:border-primary-blue-dark', !ketumWhatsappUrl ? 'opacity-60 cursor-not-allowed' : '']"
              :disabled="!ketumWhatsappUrl"
              :title="ketumWhatsappUrl ? 'Chat via WhatsApp' : 'Nomor Ketua Umum belum tersedia'"
            >
              <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Hubungi Ketua Umum
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

            <!-- Card 1: Total Anggota (dari API, animated) -->
            <div :class="['stagger-child rounded-2xl p-5 md:p-6 text-center border transition-all duration-300 cursor-default', themeClasses.statCard]">
              <div class="text-2xl md:text-3xl mb-2">👥</div>
              <div class="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-blue-600">
                {{ totalMembersCount }}
              </div>
              <div :class="['text-xs md:text-sm font-semibold mt-1.5', themeClasses.textMuted]">Total Anggota</div>
            </div>

            <!-- Card 2: Instagram -->
            <a
              href="https://www.instagram.com/hmtibansal?igsh=MTRhMDgydHpqazJsZw=="
              target="_blank" rel="noopener noreferrer"
              :class="['stagger-child rounded-2xl p-5 md:p-6 text-center border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group block no-underline', themeClasses.statCard]"
            >
              <div class="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
              <div class="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">@hmtibansal</div>
              <div :class="['text-xs md:text-sm font-semibold mt-1', themeClasses.textMuted]">Instagram</div>
            </a>

            <!-- Card 3: YouTube -->
            <a
              href="https://youtube.com/@hmtibansal?si=wnsLi1VSEX1QDFCr"
              target="_blank" rel="noopener noreferrer"
              :class="['stagger-child rounded-2xl p-5 md:p-6 text-center border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group block no-underline', themeClasses.statCard]"
            >
              <div class="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                </svg>
              </div>
              <div class="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">@hmtibansal</div>
              <div :class="['text-xs md:text-sm font-semibold mt-1', themeClasses.textMuted]">YouTube</div>
            </a>

            <!-- Card 4: TikTok -->
            <a
              href="https://www.tiktok.com/@hmti.ubs?_r=1&_t=ZS-97X51AD8ujy"
              target="_blank" rel="noopener noreferrer"
              :class="['stagger-child rounded-2xl p-5 md:p-6 text-center border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group block no-underline', themeClasses.statCard]"
            >
              <div class="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                   :class="isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-slate-800'">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                </svg>
              </div>
              <div class="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-400">@hmti.ubs</div>
              <div :class="['text-xs md:text-sm font-semibold mt-1', themeClasses.textMuted]">TikTok</div>
            </a>

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
                    @click="openOfficerProfile(officer)"
                    :class="['rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8 border transition-all duration-300 cursor-pointer hover:scale-[1.01]', themeClasses.cardGlass]">

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
            <div v-for="item in activities" :key="item.id"
              :class="['rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer', themeClasses.cardGlass]"
              @click="openItemPreview(item)">
              <div class="aspect-square bg-slate-800 overflow-hidden relative">
                <template v-if="item.document?.id && item.document.category?.startsWith('video/')">
                  <video
                    v-autoplay-on-visible
                    :src="getDocMediaUrl(item.document.id)"
                    class="w-full h-full object-cover"
                    preload="metadata" muted playsinline loop
                    @loadedmetadata="(e) => { if (e.target.duration > 0.1) e.target.currentTime = 0.5 }"
                  ></video>
                  <div class="absolute bottom-2 right-2 bg-black/50 rounded-full p-1 pointer-events-none">
                    <svg class="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  </div>
                </template>
                <img v-else-if="item.document?.id" :src="getDocMediaUrl(item.document.id)"
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                <div v-else class="w-full h-full flex items-center justify-center text-5xl opacity-30">📝</div>
              </div>
              <div class="p-5">
                <h4 :class="['font-bold text-base mb-1.5', themeClasses.text]">{{ item.title }}</h4>
                <p :class="['text-sm line-clamp-2 mb-3', themeClasses.textMuted]">{{ item.description }}</p>
                <p v-if="item.dateTime" :class="['text-xs font-medium', themeClasses.textMuted]">📅 {{ formatDate(item.dateTime) }}</p>
              </div>
            </div>
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

          <div v-if="events.length === 0"
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

          <div v-else class="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="item in events" :key="item.id"
              :class="['rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer', themeClasses.cardGlass]"
              @click="openItemPreview(item)">
              <div class="aspect-square bg-slate-800 overflow-hidden relative">
                <template v-if="item.document?.id && item.document.category?.startsWith('video/')">
                  <video
                    v-autoplay-on-visible
                    :src="getDocMediaUrl(item.document.id)"
                    class="w-full h-full object-cover"
                    preload="metadata" muted playsinline loop
                    @loadedmetadata="(e) => { if (e.target.duration > 0.1) e.target.currentTime = 0.5 }"
                  ></video>
                  <div class="absolute bottom-2 right-2 bg-black/50 rounded-full p-1 pointer-events-none">
                    <svg class="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  </div>
                </template>
                <img v-else-if="item.document?.id" :src="getDocMediaUrl(item.document.id)"
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                <div v-else class="w-full h-full flex items-center justify-center text-5xl opacity-30">🎉</div>
              </div>
              <div class="p-5">
                <h4 :class="['font-bold text-base mb-1.5', themeClasses.text]">{{ item.title }}</h4>
                <p :class="['text-sm line-clamp-2 mb-3', themeClasses.textMuted]">{{ item.description }}</p>
                <p v-if="item.dateTime" class="text-xs font-bold text-purple-400">📅 {{ formatDate(item.dateTime) }}</p>
              </div>
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
              <div class="text-4xl md:text-5xl mb-3 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                {{ item.emoji }}
              </div>
              <span :class="['text-xs md:text-sm font-bold', isDarkMode ? 'text-slate-400' : 'text-slate-500']">{{ item.label }}</span>
            </div>
            <div class="sm:col-span-3 text-center mt-2">
              <p :class="['text-xs italic', themeClasses.textMuted]">*Data prestasi akan ditampilkan secara otomatis setelah diinput.</p>
            </div>
          </div>

          <div v-else class="scroll-reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div v-for="item in achievements" :key="item.id"
              class="stagger-child rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-yellow-500/40 group cursor-pointer"
              :class="isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-white border-slate-200 hover:shadow-lg'"
              @click="openItemPreview(item)">
              <div class="aspect-square bg-slate-800 overflow-hidden relative">
                <template v-if="item.document?.id && item.document.category?.startsWith('video/')">
                  <video
                    v-autoplay-on-visible
                    :src="getDocMediaUrl(item.document.id)"
                    class="w-full h-full object-cover"
                    preload="metadata" muted playsinline loop
                    @loadedmetadata="(e) => { if (e.target.duration > 0.1) e.target.currentTime = 0.5 }"
                  ></video>
                  <div class="absolute bottom-2 right-2 bg-black/50 rounded-full p-1 pointer-events-none">
                    <svg class="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  </div>
                </template>
                <img v-else-if="item.document?.id" :src="getDocMediaUrl(item.document.id)"
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                <div v-else class="w-full h-full flex items-center justify-center text-5xl opacity-30">🏆</div>
              </div>
              <div class="p-4">
                <h4 :class="['font-bold text-base mb-1', themeClasses.text]">{{ item.title }}</h4>
                <p :class="['text-sm line-clamp-2', themeClasses.textMuted]">{{ item.description }}</p>
              </div>
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
          <button @click="openKetumWhatsapp"
            :class="['inline-flex items-center gap-2.5 px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-bold text-white text-sm md:text-base transition-all duration-200 transform hover:-translate-y-1 hover:scale-105',
              isDarkMode ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:shadow-2xl hover:shadow-green-500/30' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-2xl hover:shadow-green-500/30',
              !ketumWhatsappUrl ? 'opacity-60 cursor-not-allowed' : '']"
            :disabled="!ketumWhatsappUrl"
          >
            <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hubungi Ketua Umum →
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

    <!-- OFFICER PROFILE POPUP -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isOfficerProfileOpen && selectedOfficer"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          @click.self="closeOfficerProfile"
        >
          <Transition name="modal-zoom">
            <div
              v-if="isOfficerProfileOpen"
              :class="['relative w-full max-w-4xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col md:flex-row', isDarkMode ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200']"
              style="max-height: 90vh"
            >
              <!-- Close -->
              <button
                @click="closeOfficerProfile"
                class="absolute top-4 left-4 z-20 bg-slate-500/20 hover:bg-slate-500/40 p-2 rounded-full transition-all duration-150"
                :class="isDarkMode ? 'text-white' : 'text-slate-700'"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              <!-- LEFT: Info Details -->
              <div class="flex-1 p-8 pt-14 md:pt-8 flex flex-col justify-center overflow-y-auto">
                <div class="mb-5">
                  <span class="text-xs font-black uppercase tracking-widest text-blue-500">Detail Pengurus</span>
                  <h3 class="text-2xl font-black mt-2 leading-tight" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                    {{ selectedOfficer.name }}
                  </h3>
                  <p class="text-sm font-bold mt-1 text-blue-500">{{ selectedOfficer.jabatan }}</p>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">NIA</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedOfficer.nia }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">NPM</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedOfficer.npm || '-' }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">Role</div>
                    <div class="font-semibold mt-0.5 capitalize" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedOfficer.role }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">Angkatan</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedOfficer.angkatan || '-' }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10 col-span-2">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">Status Keanggotaan</div>
                    <div class="mt-1.5 inline-block text-xs font-bold px-3 py-1 rounded-full"
                         :class="selectedOfficer.status === 'Aktif'
                           ? 'bg-blue-500/20 text-blue-500'
                           : 'bg-red-500/20 text-red-500'">
                      {{ selectedOfficer.status }}
                    </div>
                  </div>
                </div>

                <div v-if="selectedOfficer.email || selectedOfficer.phone"
                     class="mt-4 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-2 text-sm">
                  <div v-if="selectedOfficer.email" class="flex items-center gap-3">
                    <span class="opacity-60">📧</span>
                    <span class="font-medium truncate" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedOfficer.email }}</span>
                  </div>
                  <div v-if="selectedOfficer.phone" class="flex items-center gap-3">
                    <span class="opacity-60">📞</span>
                    <span class="font-medium" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedOfficer.phone }}</span>
                  </div>
                </div>

                <div v-if="selectedOfficer.bio" class="mt-4 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 text-sm">
                  <div class="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Bio Singkat</div>
                  <p class="italic leading-relaxed text-xs" :class="isDarkMode ? 'text-slate-300/80' : 'text-slate-500'">
                    "{{ selectedOfficer.bio }}"
                  </p>
                </div>
              </div>

              <!-- RIGHT: Full Photo with name + label -->
              <div class="w-full md:w-80 lg:w-96 relative min-h-[280px] md:min-h-full shrink-0">
                <div class="absolute inset-3 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    :src="selectedOfficer.img"
                    :alt="selectedOfficer.name"
                    class="w-full h-full object-cover"
                  />
                  <!-- Gradient overlay -->
                  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
                    <h3 class="text-white font-black text-xl leading-tight drop-shadow-lg">{{ selectedOfficer.name }}</h3>
                    <p class="text-white/80 text-sm font-medium mt-0.5">{{ selectedOfficer.jabatan }}</p>
                    <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                         :class="selectedOfficer.status === 'Aktif'
                           ? 'bg-blue-500 text-white'
                           : 'bg-red-500 text-white'">
                      <span class="w-1.5 h-1.5 rounded-full bg-white/80 inline-block"></span>
                      {{ selectedOfficer.status }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- PREVIEW MODAL -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="selectedItem"
          class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 backdrop-blur-md p-4"
          @click.self="closeItemPreview"
        >
          <button @click="closeItemPreview"
            class="fixed top-5 right-5 z-[10000] p-3 text-white bg-red-600 hover:bg-red-700 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="flex flex-col items-center gap-5 w-full max-w-5xl mx-auto">
            <video
              v-if="previewRenderType === 'video'"
              ref="previewVideoEl"
              :src="getDocMediaUrl(selectedItem.document.id)"
              class="rounded-xl shadow-2xl border border-white/10 w-full max-h-[72vh]"
              style="object-fit: contain;"
              controls autoplay
            ></video>
            <img
              v-else-if="selectedItem.document?.id"
              :src="getDocMediaUrl(selectedItem.document.id)"
              class="rounded-xl shadow-2xl border border-white/10 max-h-[76vh] max-w-full w-auto h-auto"
              style="object-fit: contain;"
              alt="Preview"
            />
            <div class="shrink-0 text-center bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/10">
              <h3 class="text-xl md:text-2xl font-black tracking-tight text-white">{{ selectedItem.title }}</h3>
              <p v-if="selectedItem.description" class="text-sm text-blue-200/70 mt-1">{{ selectedItem.description }}</p>
              <p v-if="selectedItem.dateTime" class="text-xs text-slate-400 mt-1.5">📅 {{ formatDate(selectedItem.dateTime) }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
