<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import AnimatedBackground from '../components/AnimatedBackground.vue'
import BrandLogo from '../components/BrandLogo.vue'
// import axios from 'axios' // Opsional, kalau mau taruh data kecil di navbar

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// --- LOGIKA TEMA (KONSISTEN DENGAN HALAMAN LAIN) ---
const isDarkMode = computed(() => themeStore.isDarkMode)

const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      textMuted: 'text-blue-200/70',
      cardGlass: 'bg-slate-800/40 border border-white/10 hover:border-blue-500/50 hover:bg-slate-800/60 backdrop-blur-md',
      cardText: 'text-white',
      cardDesc: 'text-blue-200/60',
      iconBg: 'bg-white/5',
      navbarGlass: 'bg-white/10 backdrop-blur-md border-b border-white/10'
    }
  } else {
    return {
      bg: 'bg-cream',
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      cardGlass: 'bg-white border border-amber-200/70 hover:border-primary-blue/40 hover:shadow-xl shadow-md backdrop-blur-sm',
      cardText: 'text-stone-800',
      cardDesc: 'text-stone-500',
      iconBg: 'bg-cream-light',
      navbarGlass: 'bg-cream-light/90 backdrop-blur-md border-b border-amber-200 shadow-sm'
    }
  }
})

// --- LOGIKA LOGOUT ---
const handleLogout = () => {
  if(confirm('Yakin ingin keluar dari sistem?')) {
    authStore.logout()
    router.push('/')
  }
}

// --- DATA MENU / WINDOW ---
const menuItems = [
  {
    id: 1,
    title: 'Manajemen Anggota',
    desc: 'Kelola data anggota, jabatan, status keanggotaan, dan akses.',
    icon: 'users', // Placeholder untuk logika icon
    color: 'from-blue-500 to-cyan-500',
    route: '/admin/members'
  },
  {
    id: 2,
    title: 'Keuangan & Kas',
    desc: 'Pencatatan pemasukan, pengeluaran, dan laporan keuangan.',
    icon: 'money',
    color: 'from-amber-500 to-orange-500',
    route: '/admin/finance'
  },
  {
    id: 3,
    title: 'Dokumentasi',
    desc: 'Arsip digital surat, proposal, foto, dan video kegiatan.',
    icon: 'folder',
    color: 'from-emerald-500 to-teal-500',
    route: '/admin/docs'
  },
  {
    id: 4,
    title: 'Showcase Hub',
    desc: 'Kelola konten publik: Event, Prestasi, dan Berita.',
    icon: 'globe',
    color: 'from-purple-500 to-pink-500',
    route: '/admin/showcase' // Halaman baru
  },
  {
    id: 5,
    title: 'Edit Profile',
    desc: 'Ubah password, foto profil, dan data diri admin.',
    icon: 'user',
    color: 'from-indigo-500 to-blue-600',
    route: '/admin/profile' // Halaman baru
  }
]

// Fungsi helper untuk ikon SVG
// --- SCROLL REVEAL ANIMATIONS ---
let scrollObserver = null

const setupScrollAnimations = () => {
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        const children = entry.target.querySelectorAll('.stagger-child')
        children.forEach((child, i) => {
          setTimeout(() => child.classList.add('is-visible'), i * 100)
        })
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' })
  document.querySelectorAll('.scroll-reveal').forEach(el => scrollObserver.observe(el))
}

const getIconSvg = (iconName) => {
  const icons = {
    users: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />',
    money: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
    folder: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />',
    globe: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />',
    user: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />'
  }
  return icons[iconName] || icons['user']
}

onMounted(async () => {
  await nextTick()
  setupScrollAnimations()
})

onUnmounted(() => {
  if (scrollObserver) scrollObserver.disconnect()
})
</script>

<template>
  <div :class="['min-h-screen relative overflow-hidden transition-colors duration-500', themeClasses.bg]">
    
    <!-- BACKGROUND ANIMATION -->
    <AnimatedBackground :isDarkMode="isDarkMode" />

    <!-- NAVBAR (GLASSMORPHISM) -->
    <nav :class="['sticky top-0 z-50 transition-all duration-300', themeClasses.navbarGlass]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Logo Area -->
          <BrandLogo size="md" :isDarkMode="isDarkMode" subtitle="ADMIN" />

          <!-- Right Actions -->
          <div class="flex items-center gap-4">
            <!-- Lihat Website Link -->
            <a href="/" target="_blank" 
               class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
               :class="isDarkMode ? 'border-white/10 text-blue-300 hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Lihat Website
            </a>

            <!-- User Info & Theme Toggle -->
            <div class="flex items-center gap-3 border-l pl-4"
                 :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
              
              <!-- Theme Toggle -->
              <button @click="themeStore.toggleTheme()" 
                class="p-2 rounded-full transition-transform hover:rotate-12"
                :class="isDarkMode ? 'text-yellow-400' : 'text-slate-400'">
                <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>

              <!-- Logout -->
              <button @click="handleLogout" 
                class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30">
                KELUAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 py-12">
      
      <!-- Welcome Header -->
      <div class="mb-12 text-center md:text-left">
        <h2 class="hero-fade-up" :class="['text-3xl md:text-5xl font-bold mb-2', themeClasses.text]">
          Selamat Datang, 
          <span :class="['bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400', themeClasses.text]">
            {{ authStore.user ? authStore.user.name : 'Admin' }}
          </span>
        </h2>
        <p class="hero-fade-up" style="animation-delay:0.1s" :class="['text-lg', themeClasses.textMuted]">
          Akses cepat ke modul manajemen sistem HMTI.
        </p>
      </div>

      <!-- GRID MENU (WINDOWS) -->
      <!-- Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop -->
      <div class="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- LOOPING MENU ITEMS -->
        <div
          v-for="item in menuItems"
          :key="item.id"
          @click="router.push(item.route)"
          class="stagger-child group relative rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
          :class="themeClasses.cardGlass"
        >
          <!-- Background Glow on Hover -->
          <div :class="[
            'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br',
            item.color
          ]"></div>

          <div class="relative z-10 flex flex-col h-full justify-between">
            <!-- Icon & Title -->
            <div>
              <div :class="[
                'w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br',
                item.color
              ]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="getIconSvg(item.icon)"></svg>
              </div>
              
              <h3 :class="['text-xl font-bold mb-2', themeClasses.cardText]">{{ item.title }}</h3>
              <p :class="['text-sm leading-relaxed mb-4', themeClasses.cardDesc]">{{ item.desc }}</p>
            </div>

            <!-- Footer Action -->
            <div class="flex items-center justify-between mt-4 pt-4 border-t transition-colors"
                 :class="isDarkMode ? 'border-white/5' : 'border-slate-100'">
              <span class="text-xs font-bold uppercase tracking-wider opacity-60">Open Module</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:translate-x-1 transition-transform" :class="isDarkMode ? 'text-blue-400' : 'text-blue-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

