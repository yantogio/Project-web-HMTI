<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import SpeedDialNav from './SpeedDialNav.vue'
import AnimatedBackground from './AnimatedBackground.vue'
import BrandLogo from './BrandLogo.vue'

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

const goBackToMenu = () => {
  router.push('/admin')
}

const handleLogout = () => {
  if (confirm(props.logoutMessage)) {
    authStore.logout()
    router.push('/')
  }
}
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

    <SpeedDialNav />

    <div :class="contentClasses">
      <slot />
    </div>
  </div>
</template>
