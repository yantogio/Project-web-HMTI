<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios' // <--- 1. Import Axios
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const themeStore = useThemeStore()

// --- STATE ---
const isDarkMode = computed(() => themeStore.isDarkMode)
const officers = ref([]) // <--- Data akan diisi dari backend, kosong di awal
const isLoading = ref(true) // <--- Untuk menampilkan loading state

// --- DATA KOSONG UNTUK SHOWCASE BARU ---
const activities = ref([])      // Data Kegiatan
const achievements = ref([])   // Data Prestasi
// const events = ref([])      // Kalau nanti Event mau dipisah total dari Kegiatan

// --- CAROUSEL LOGIC (Sama seperti sebelumnya) ---
const currentSlide = ref(0)
const slideInterval = ref(null)
const isPaused = ref(false)

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % officers.value.length
}
const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + officers.value.length) % officers.value.length
}
const goToSlide = (index) => {
  currentSlide.value = index
}

const startAutoPlay = () => {
  stopAutoPlay()
  slideInterval.value = setInterval(() => {
    if (!isPaused.value && officers.value.length > 0) nextSlide()
  }, 4000)
}

const stopAutoPlay = () => {
  if (slideInterval.value) clearInterval(slideInterval.value)
}

// --- 2. LOGIKA AMBIL DATA DARI DATABASE ---
const fetchOfficers = async () => {
  try {
    isLoading.value = true
    // Mengambil data dari endpoint members
    const response = await axios.get('http://localhost:3000/members')

    // Filter: Hanya ambil yang role-nya BUKAN 'anggota' (Jadi Ketum, Sekjen, dll)
    // Juga pastikan statusnya 'Aktif' (opsional, tapi lebih rapi)
    const data = response.data.filter(m => m.role !== 'anggota' && m.status === 'Aktif')

    // Mapping Data: Karena database belum ada kolom foto,
    // kita buat URL avatar dinamis berdasarkan Nama agar tampilan tetap bagus.
    officers.value = data.map(member => ({
      ...member,
      // Menggunakan layanan UI Avatars untuk membuat inisial keren
      img: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=256&font-size=0.33`
    }))

  } catch (error) {
    console.error('Gagal mengambil data pengurus:', error)
    alert('Gagal memuat data pengurus. Pastikan Backend sudah berjalan.')
  } finally {
    isLoading.value = false
  }
}

// --- LIFECYCLE ---
onMounted(() => {
  fetchOfficers() // <--- Panggil fungsi ambil data saat halaman dimuat
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})

// --- THEME CLASSES (Sama seperti sebelumnya) ---
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      bgGlass: 'bg-white/10 border-white/10 backdrop-blur-md',
      cardGlass: 'bg-slate-800/40 border-white/5',
      textMuted: 'text-blue-200',
      gradientText: 'from-blue-300 via-white to-blue-200',
      heroOverlay: 'from-blue-900/40 via-transparent to-slate-900/40',
      inputBg: 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
    }
  } else {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      bgGlass: 'bg-white/70 border-slate-200/60 backdrop-blur-md shadow-lg',
      cardGlass: 'bg-white border-slate-200 shadow-xl',
      textMuted: 'text-slate-600',
      gradientText: 'from-blue-600 via-indigo-600 to-blue-800',
      heroOverlay: 'from-blue-50/80 via-white/50 to-slate-50/80',
      inputBg: 'bg-white/80 border-slate-300 text-slate-900 placeholder-slate-400'
    }
  }
})
</script>

<template>
  <div :class="['min-h-screen transition-colors duration-500 relative overflow-hidden', themeClasses.bg]">

    <!-- BACKGROUND ANIMATION (ORB) -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div :class="[
        'absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob transition-colors duration-500',
        isDarkMode ? 'bg-blue-600' : 'bg-blue-300'
      ]"></div>
      <div :class="[
        'absolute top-0 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 transition-colors duration-500',
        isDarkMode ? 'bg-indigo-600' : 'bg-indigo-300'
      ]"></div>
      <div :class="[
        'absolute -bottom-32 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 transition-colors duration-500',
        isDarkMode ? 'bg-purple-600' : 'bg-purple-300'
      ]"></div>
    </div>

    <!-- NAVBAR (GLASSMORPHISM) -->
    <nav :class="[
      'fixed top-0 w-full z-50 transition-all duration-300',
      isDarkMode ? 'bg-white/5 backdrop-blur-md border-b border-white/10' : 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm'
    ]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20 items-center">

          <!-- LOGO -->
          <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/')">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              H
            </div>
            <div>
              <h1 :class="['font-bold text-xl tracking-wide', isDarkMode ? 'text-white' : 'text-slate-900']">
                HMTI <span class="font-light" :class="isDarkMode ? 'text-blue-300' : 'text-blue-600'">Universitas Bani
                  Saleh</span>
              </h1>
            </div>
          </div>

          <!-- LINKS & ACTIONS -->
          <div class="flex items-center gap-4">
            <!-- Theme Toggle -->
            <button @click="themeStore.toggleTheme()" :class="[
              'p-2 rounded-full transition-all duration-300 hover:scale-110',
              isDarkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            ]" title="Ganti Tema">
              <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <!-- Login Button -->
            <router-link to="/login"
              class="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login Anggota
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="relative z-10 pt-20">

      <!-- HERO SECTION (IDE CEMERLANG) -->
      <section class="min-h-[90vh] flex items-center justify-center px-4 relative">
        <div class="max-w-5xl mx-auto text-center">

          <!-- Badge / Subtitle -->
          <div :class="[
            'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border backdrop-blur-sm animate-pulse',
            isDarkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-100 border-blue-200 text-blue-700'
          ]">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
            Website Resmi HMTI
          </div>

          <!-- Main Headline -->
          <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Membangun Masa Depan<br>
            <span :class="['bg-clip-text text-transparent bg-gradient-to-r', themeClasses.gradientText]">
              Dengan Teknologi
            </span>
          </h1>

          <!-- Subheadline -->
          <p :class="['text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed', themeClasses.textMuted]">
            Wadah aspirasi, kreasi, dan inovasi mahasiswa Teknik Informatika.
            Bersatu untuk kemajuan, berprestasi untuk negeri.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <button @click="router.push('/login')"
              class="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1">
              Gabung Sekarang
            </button>
            <button
              class="px-8 py-4 rounded-xl font-bold border transition-all transform hover:-translate-y-1 hover:bg-white/5"
              :class="isDarkMode ? 'border-white/20 text-white' : 'border-slate-300 text-slate-700'">
              Pelajari Lebih Lanjut
            </button>
          </div>

        </div>
      </section>

      <!-- OFFICER CAROUSEL SECTION (TOTAL OVERHAUL) -->
      <section class="py-20 px-4 relative overflow-hidden">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <h2 :class="['text-4xl font-bold mb-4', themeClasses.text]">Pengurus Inti</h2>
          <div class="h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <p :class="['mt-4', themeClasses.textMuted]">Mengenal tim yang berdedikasi untuk HMTI.</p>
        </div>

        <!-- Carousel Container -->
        <div class="relative max-w-6xl mx-auto group" @mouseenter="isPaused = true" @mouseleave="isPaused = false">
          <!-- Carousel Container -->
          <div class="relative max-w-6xl mx-auto group" @mouseenter="isPaused = true" @mouseleave="isPaused = false">

            <!-- LOADING STATE (Baru) -->
            <div v-if="isLoading" class="h-80 flex items-center justify-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>

            <!-- EMPTY STATE (Jika tidak ada pengurus) -->
            <div v-else-if="officers.length === 0" class="text-center py-20">
              <p :class="themeClasses.textMuted">Belum ada data pengurus yang ditampilkan.</p>
            </div>

            <!-- SLIDER UTAMA (Hanya muncul jika ada data) -->
            <div v-else class="overflow-hidden rounded-2xl p-2">
              <!-- ... (kode slide wrapper yang lama tetap sama di sini) ... -->
              <div class="flex transition-transform duration-700 ease-in-out h-full"
                :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
                <!-- ... (kode v-for card yang lama tetap sama di sini) ... -->
                <!-- Kode v-for officer sudah otomatis menggunakan data baru dari database -->
              </div>
            </div>

            <!-- ... (Navigasi panah dan dots tetap sama) ... -->
          </div>

          <!-- Slides Wrapper -->
          <div class="overflow-hidden rounded-2xl p-2">
            <div class="flex transition-transform duration-700 ease-in-out h-full"
              :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
              <!-- Individual Slide Cards -->
              <div v-for="(officer, index) in officers" :key="officer.nia" class="w-full flex-shrink-0 px-4">
                <div :class="[
                  'rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 transition-all duration-300 border transform hover:scale-[1.02]',
                  themeClasses.cardGlass
                ]">
                  <!-- Image Area -->
                  <div class="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                    <div
                      class="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-md opacity-50 animate-pulse">
                    </div>
                    <img :src="officer.img || 'https://via.placeholder.com/200'" :alt="officer.name"
                      class="relative w-full h-full object-cover rounded-full border-4 shadow-xl"
                      :class="isDarkMode ? 'border-slate-700' : 'border-white'">
                  </div>

                  <!-- Text Content -->
                  <div class="text-center md:text-left flex-1">
                    <div :class="['text-xs font-bold uppercase tracking-widest mb-2 inline-block px-3 py-1 rounded-full',
                      isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700']">
                      {{ officer.role }}
                    </div>
                    <h3 :class="['text-2xl md:text-3xl font-bold mb-2', themeClasses.text]">{{ officer.name }}</h3>
                    <p :class="['text-lg font-medium mb-4', themeClasses.textMuted]">{{ officer.jabatan }}</p>

                    <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                      <span :class="['px-3 py-1 rounded-lg text-sm font-mono border', themeClasses.inputBg]">
                        NIA: {{ officer.nia }}
                      </span>
                      <span :class="['px-3 py-1 rounded-lg text-sm font-mono border', themeClasses.inputBg]">
                        NPM: {{ officer.npm }}
                      </span>
                    </div>

                    <!-- Social Icons Dummy -->
                    <div
                      class="mt-6 flex gap-4 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity">
                      <div class="w-8 h-8 rounded-full bg-current cursor-pointer"></div>
                      <div class="w-8 h-8 rounded-full bg-current cursor-pointer"></div>
                      <div class="w-8 h-8 rounded-full bg-current cursor-pointer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Controls (Visible on Hover) -->
          <!-- Prev Button -->
          <button @click="prevSlide"
            class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 hover:scale-110 z-20"
            :class="isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white shadow-lg'">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          <!-- Next Button -->
          <button @click="nextSlide"
            class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 hover:scale-110 z-20"
            :class="isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white shadow-lg'">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>

          <!-- Dots Indicator -->
          <div class="flex justify-center gap-2 mt-6">
            <button v-for="(officer, index) in officers" :key="index" @click="goToSlide(index)"
              class="w-3 h-3 rounded-full transition-all duration-300" :class="currentSlide === index
                ? (isDarkMode ? 'bg-blue-500 w-8' : 'bg-blue-600 w-8')
                : (isDarkMode ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-300 hover:bg-slate-400')"></button>
          </div>

        </div>
      </section>

      <!-- ========================================== -->
      <!-- BAGIAN 1: SHOWCASE KEGIATAN (GRID DESIGN)  -->
      <!-- ========================================== -->
      <section class="py-20 px-4 relative">
        <div class="max-w-7xl mx-auto">

          <!-- Header Section -->
          <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 :class="['text-3xl md:text-4xl font-bold', themeClasses.text]">
                Galeri Kegiatan
              </h2>
              <div class="h-1 w-20 bg-blue-500 mt-2 rounded-full"></div>
            </div>
            <div :class="['text-sm font-medium px-4 py-2 rounded-lg border', themeClasses.inputBg]">
              📅 Arsip Aktivitas Himpunan
            </div>
          </div>

          <!-- EMPTY STATE (Muncul karena activities.value kosong) -->
          <div v-if="activities.length === 0"
            class="text-center py-16 border-2 border-dashed rounded-2xl transition-colors duration-500"
            :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              :class="isDarkMode ? 'bg-white/5' : 'bg-slate-100'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-50"
                :class="isDarkMode ? 'text-blue-400' : 'text-blue-600'" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 :class="['text-xl font-bold mb-2', themeClasses.text]">Belum Ada Kegiatan</h3>
            <p :class="['max-w-md mx-auto', themeClasses.textMuted]">
              Data kegiatan himpunan belum tersedia saat ini. Nantikan update aktivitas terbaru kami.
            </p>
          </div>

          <!-- GRID CONTENT (Akan muncul kalau data ada) -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Card Component Loop akan ada di sini nanti -->
          </div>
        </div>
      </section>


      <!-- ========================================== -->
      <!-- BAGIAN 2: SHOWCASE EVENT (HIGHLIGHT CARD) -->
      <!-- ========================================== -->
      <section class="py-10 px-4 relative overflow-hidden">
        <!-- Background Decoration khusus Event -->
        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -z-10">
        </div>

        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row justify-between items-center mb-10">
            <div>
              <span class="text-purple-400 font-bold tracking-widest text-xs uppercase">Upcoming</span>
              <h2 :class="['text-3xl md:text-4xl font-bold mt-1', themeClasses.text]">Event Besar</h2>
            </div>
          </div>

          <!-- EMPTY STATE EVENT -->
          <div v-if="activities.length === 0"
            class="relative rounded-2xl p-8 md:p-12 text-center overflow-hidden transition-colors duration-500"
            :class="isDarkMode ? 'bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/20' : 'bg-white border border-purple-100 shadow-xl'">
            <div class="relative z-10">
              <span class="text-4xl mb-4 block">🎉</span>
              <h3 :class="['text-2xl font-bold mb-2', themeClasses.text]">Tidak Ada Event Mendatang</h3>
              <p :class="['max-w-lg mx-auto', themeClasses.textMuted]">
                Tetap pantau halaman ini untuk informasi seminar, workshop, dan kompetisi skala besar.
              </p>
            </div>
          </div>
        </div>
      </section>


      <!-- ========================================== -->
      <!-- BAGIAN 3: SHOWCASE PRESTASI (TROPHY CASE) -->
      <!-- ========================================== -->
      <section class="py-20 px-4 relative">
        <div class="max-w-7xl mx-auto">

          <!-- Header dengan Aksen Emas -->
          <div class="text-center mb-16">
            <div class="inline-block p-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 :class="['text-3xl md:text-4xl font-bold', themeClasses.text]">
              Dinding Prestasi
            </h2>
            <div class="h-1 w-20 bg-gradient-to-r from-yellow-400 to-orange-500 mt-2 mx-auto rounded-full"></div>
            <p :class="['mt-4', themeClasses.textMuted]">Bukti nyata dedikasi dan kerja keras anggota HMTI.</p>
          </div>

          <!-- EMPTY STATE PRESTASI -->
          <div v-if="achievements.length === 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Placeholder visual 1 -->
            <div
              class="rounded-2xl p-6 border border-dashed flex flex-col items-center justify-center text-center min-h-[200px] transition-all hover:border-yellow-500/50 group"
              :class="isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'">
              <div class="text-3xl mb-3 grayscale group-hover:grayscale-0 transition-all">🥇</div>
              <span class="text-sm font-bold" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">Juara 1
                Nasional</span>
            </div>
            <!-- Placeholder visual 2 -->
            <div
              class="rounded-2xl p-6 border border-dashed flex flex-col items-center justify-center text-center min-h-[200px] transition-all hover:border-yellow-500/50 group"
              :class="isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'">
              <div class="text-3xl mb-3 grayscale group-hover:grayscale-0 transition-all">🏆</div>
              <span class="text-sm font-bold" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">Best
                Speaker</span>
            </div>
            <!-- Placeholder visual 3 -->
            <div
              class="rounded-2xl p-6 border border-dashed flex flex-col items-center justify-center text-center min-h-[200px] transition-all hover:border-yellow-500/50 group"
              :class="isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'">
              <div class="text-3xl mb-3 grayscale group-hover:grayscale-0 transition-all">🎖️</div>
              <span class="text-sm font-bold" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">Top
                Innovation</span>
            </div>

            <div class="md:col-span-3 text-center mt-4">
              <p :class="['text-sm italic', themeClasses.textMuted]">*Data prestasi akan ditampilkan secara otomatis
                setelah diinput.</p>
            </div>
          </div>

        </div>
      </section>

      <!-- FOOTER SIMPLE -->
      <footer
        :class="['py-8 text-center border-t backdrop-blur-sm transition-colors duration-500', isDarkMode ? 'bg-white/5 border-white/10 text-blue-200/50' : 'bg-white/60 border-slate-200 text-slate-500']">
        <p>&copy; 2026 HMTI System. Built with Vue 3 & Tailwind.</p>
      </footer>

    </main>
  </div>
</template>

<style>
/* Animasi Blob dari Anggota.vue */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }

  33% {
    transform: translate(30px, -50px) scale(1.1);
  }

  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }

  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 10s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>