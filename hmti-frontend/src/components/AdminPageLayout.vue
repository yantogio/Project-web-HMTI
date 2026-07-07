<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import SpeedDialNav from './SpeedDialNav.vue'
import AnimatedBackground from './AnimatedBackground.vue'
import BrandLogo from './BrandLogo.vue'
import http from '@/api/http'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const props = defineProps({
  section: {
    type: String,
    default: 'ADMIN'
  },
  accent: {
    type: String,
    default: 'blue'
  },
  badge: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'rounded'
  },
  contentClass: {
    type: String,
    default: ''
  },
  logoutMessage: {
    type: String,
    default: 'Keluar dari sistem?'
  }
})

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isDarkMode = computed(() => themeStore.isDarkMode)

const accents = {
  blue: {
    glowA: 'bg-blue-600',
    glowB: 'bg-indigo-600',
    lightGlowA: 'bg-primary-blue/40',
    lightGlowB: 'bg-accent-orange/30',
    darkText: 'from-blue-200 to-white',
    lightText: 'from-primary-blue to-primary-blue-dark',
    darkSection: 'text-blue-200',
    lightSection: 'text-primary-blue',
    badge: 'from-primary-blue to-primary-blue-dark shadow-primary-blue/30'
  },
  amber: {
    glowA: 'bg-blue-600',
    glowB: 'bg-amber-600',
    lightGlowA: 'bg-primary-blue/35',
    lightGlowB: 'bg-accent-orange/35',
    darkText: 'from-amber-200 to-white',
    lightText: 'from-primary-blue to-accent-orange',
    darkSection: 'text-amber-200',
    lightSection: 'text-primary-blue',
    badge: 'from-accent-orange to-accent-orange-dark shadow-accent-orange/30'
  },
  emerald: {
    glowA: 'bg-emerald-600',
    glowB: 'bg-teal-600',
    lightGlowA: 'bg-primary-blue/30',
    lightGlowB: 'bg-amber-400/40',
    darkText: 'from-blue-200 to-white',
    lightText: 'from-primary-blue to-primary-blue-dark',
    darkSection: 'text-blue-200',
    lightSection: 'text-primary-blue',
    badge: 'from-emerald-500 to-teal-600 shadow-emerald-500/30'
  },
  indigo: {
    glowA: 'bg-indigo-600',
    glowB: 'bg-blue-600',
    lightGlowA: 'bg-primary-blue/40',
    lightGlowB: 'bg-accent-orange/25',
    darkText: 'from-indigo-200 to-white',
    lightText: 'from-primary-blue to-primary-blue-dark',
    darkSection: 'text-indigo-200',
    lightSection: 'text-primary-blue',
    badge: 'from-primary-blue to-primary-blue-dark shadow-primary-blue/30'
  },
  purple: {
    glowA: 'bg-purple-600',
    glowB: 'bg-pink-600',
    lightGlowA: 'bg-primary-blue/30',
    lightGlowB: 'bg-accent-orange/30',
    darkText: 'from-purple-200 to-white',
    lightText: 'from-primary-blue to-accent-orange',
    darkSection: 'text-purple-200',
    lightSection: 'text-primary-blue',
    badge: 'from-primary-blue via-accent-orange to-accent-orange-dark shadow-accent-orange/30'
  }
}

const accentClasses = computed(() => accents[props.accent] || accents.blue)

const rootClass = computed(() => [
  'min-h-screen relative overflow-hidden transition-colors duration-500',
  props.variant === 'padded' ? 'p-4 md:p-8' : '',
  isDarkMode.value
    ? props.variant === 'padded'
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800'
      : 'bg-slate-900'
    : props.variant === 'padded'
      ? 'bg-gradient-to-br from-cream-light via-cream to-cream-dark/40'
      : 'bg-cream'
])

const navClass = computed(() => {
  const glass = isDarkMode.value
    ? 'bg-white/10 backdrop-blur-md border-white/10 text-white'
    : 'bg-cream-light/90 backdrop-blur-md border-amber-200 text-stone-900 shadow-sm'

  if (props.variant === 'padded') {
    return ['border-b sticky top-0 z-40 shadow-2xl rounded-2xl mb-8 transition-all duration-300', glass]
  }

  if (props.variant === 'flat') {
    return ['sticky top-0 z-40 transition-all duration-300 border-b', glass]
  }

  return ['sticky top-0 z-40 shadow-2xl rounded-b-2xl mb-8 transition-all duration-300 border-b', glass]
})

const navHeight = computed(() => props.variant === 'flat' ? 'h-20' : 'h-16')
const contentClasses = computed(() => [
  'relative z-10',
  isDarkMode.value ? 'text-white' : 'text-slate-900',
  props.contentClass
])

const { success: toastSuccess, error: toastError } = useToast()
const { confirm: confirmDialog } = useConfirm()

const goBackToMenu = () => {
  router.push('/admin')
}

const handleLogout = async () => {
  const ok = await confirmDialog(props.logoutMessage)
  if (ok) {
    authStore.logout()
    router.push('/')
  }
}

// ============================================================
// BANNER NOTIFIKASI GENERATE TAGIHAN (Hanya untuk Bendahara)
// ============================================================

const isBendahara = computed(() => authStore.user?.role === 'bendahara')
const generateStatus = ref(null)
const isBannerVisible = ref(false)
const isGeneratingFromBanner = ref(false)

const getCurrentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const getCurrentPeriodLabel = () => {
  const now = new Date()
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
    'Agustus','September','Oktober','November','Desember']
  return `${months[now.getMonth()]} ${now.getFullYear()}`
}

const skipKey = computed(() => `skip_dues_${getCurrentPeriod()}`)

const showBanner = computed(() =>
  isBendahara.value &&
  isBannerVisible.value &&
  generateStatus.value &&
  !generateStatus.value.generated
)

const checkGenerateStatus = async () => {
  if (!isBendahara.value || !authStore.token) return
  if (localStorage.getItem(skipKey.value) === 'true') return

  try {
    const period = getCurrentPeriod()
    const res = await http.get('/finance/generate-status', {
      params: { period },
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    generateStatus.value = res.data
    isBannerVisible.value = !res.data.generated
  } catch (e) {
    console.error('Gagal cek status tagihan:', e)
  }
}

const dismissBanner = () => {
  localStorage.setItem(skipKey.value, 'true')
  isBannerVisible.value = false
}

const generateFromBanner = async () => {
  isGeneratingFromBanner.value = true
  try {
    const period = getCurrentPeriod()
    const [year, month] = period.split('-').map(Number)
    await http.post('/finance/generate-dues', {
      period, month, year
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    isBannerVisible.value = false
    generateStatus.value = { ...generateStatus.value, generated: true }
    toastSuccess('Tagihan bulan ini berhasil dibuat untuk semua anggota aktif!')
  } catch (e) {
    toastError('Gagal membuat tagihan: ' + (e?.response?.data?.message || e.message))
  } finally {
    isGeneratingFromBanner.value = false
  }
}

onMounted(() => {
  checkGenerateStatus()
})
</script>

<template>
  <div :class="rootClass">
    <AnimatedBackground :isDarkMode="isDarkMode" />

    <nav :class="navClass">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div :class="['flex items-center justify-between', navHeight]">
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              @click="goBackToMenu"
              :class="['shrink-0 transition-colors', isDarkMode ? 'text-blue-200 hover:text-white' : 'text-primary-blue hover:text-primary-blue-dark']"
              aria-label="Kembali ke menu admin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m7 7V5a3 3 0 01-3 3h-4M3 8h4a3 3 0 013 3v8a3 3 0 01-3 3h-4a3 3 0 01-3-3V8z"
                />
              </svg>
            </button>

            <BrandLogo
              size="md"
              :isDarkMode="isDarkMode"
              :subtitle="section"
            />
          </div>

          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="themeStore.toggleTheme()"
              :class="[
                'p-2 rounded-full transition-all duration-300 hover:scale-110',
                isDarkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-amber-100 text-stone-600 hover:bg-amber-200 border border-amber-200'
              ]"
              title="Ganti Tema"
              aria-label="Ganti tema"
            >
              <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <div class="hidden md:block text-right">
              <div :class="['text-sm font-bold', isDarkMode ? 'text-white' : 'text-stone-900']">
                {{ authStore.user ? authStore.user.name : 'User' }}
              </div>
              <div :class="['text-xs capitalize', isDarkMode ? 'text-blue-200/60' : 'text-stone-500']">
                {{ authStore.user ? authStore.user.role : 'Guest' }}
              </div>
            </div>

            <button
              type="button"
              @click="handleLogout"
              class="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              KELUAR
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- BANNER NOTIFIKASI TAGIHAN (Bendahara Only) -->
    <div
      v-if="showBanner"
      class="relative z-30 max-w-7xl mx-auto px-4 mb-4"
    >
      <div
        :class="[
          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 rounded-2xl border shadow-lg',
          isDarkMode
            ? 'bg-amber-500/15 border-amber-400/30 text-amber-100'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        ]"
      >
        <!-- Icon + Teks -->
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div class="shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-sm leading-tight">
              Tagihan Bulan {{ getCurrentPeriodLabel() }} Belum Dibuat
            </p>
            <p class="text-xs mt-0.5 opacity-80">
              <template v-if="generateStatus?.pendingLateFeeCount > 0">
                {{ generateStatus.pendingLateFeeCount }} anggota akan dikenakan denda keterlambatan dari bulan lalu.
              </template>
              <template v-else>
                Belum ada anggota yang kena denda bulan ini.
              </template>
            </p>
          </div>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="generateFromBanner"
            :disabled="isGeneratingFromBanner"
            :class="[
              'px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed',
              isDarkMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30'
            ]"
          >
            {{ isGeneratingFromBanner ? 'Membuat...' : 'Buat Tagihan' }}
          </button>
          <button
            @click="dismissBanner"
            :class="[
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
              isDarkMode
                ? 'border-amber-400/30 text-amber-300 hover:bg-amber-400/10'
                : 'border-amber-300 text-amber-700 hover:bg-amber-100'
            ]"
          >
            Lewati Bulan Ini
          </button>
        </div>
      </div>
    </div>

    <SpeedDialNav />

    <div :class="contentClasses">
      <slot />
    </div>
  </div>
</template>
