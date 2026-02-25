<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// --- 1. STATE & THEME ---
const isDarkMode = ref(true)
const activeTab = ref('surat') // 'surat', 'media', 'branding'
const searchQuery = ref('')

// Theme Classes (Sama seperti Anggota & Finance)
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      textMuted: 'text-blue-200/60',
      cardGlass: 'bg-slate-800/40 border border-white/10 hover:border-white/20 backdrop-blur-md',
      tableHead: 'bg-slate-700/50 text-blue-200',
      tableRow: 'hover:bg-white/5 border-b border-white/5',
      navGlass: 'bg-white/10 backdrop-blur-md border-b border-white/10',
      inputBg: 'bg-white/5 border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500 focus:bg-white/10',
      tabActive: 'bg-blue-600 text-white shadow-lg shadow-blue-500/40',
      tabInactive: 'bg-white/5 text-blue-200 hover:bg-white/10',
      btnBack: 'text-blue-200 hover:text-white',
      btnBackMobile: 'bg-white/10 text-white border-white/20 hover:bg-white/20'
    }
  } else {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      cardGlass: 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg shadow-sm backdrop-blur-sm',
      tableHead: 'bg-slate-50 text-slate-600',
      tableRow: 'hover:bg-slate-50 border-b border-slate-100',
      navGlass: 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm',
      inputBg: 'bg-white/50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white',
      tabActive: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
      tabInactive: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
      btnBack: 'text-blue-600 hover:text-blue-800',
      btnBackMobile: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
    }
  }
})

// --- 2. DATA DUMMY ---

// Data Surat (Simulasi Auto Numbering)
const lettersData = ref([
  { id: 1, no: '001/HMTI/X/2023', title: 'Undangan Rapat Koordinasi', date: '2023-10-01', sender: 'BEM FAKULTAS', type: 'Surat Masuk', file: 'undangan_rapat.pdf' },
  { id: 2, no: '002/HMTI/X/2023', title: 'Peminjaman Ruang Seminar', date: '2023-10-05', sender: 'HMTI', type: 'Surat Keluar', file: 'surat_peminjaman.pdf' },
  { id: 3, no: '003/HMTI/X/2023', title: 'Proposal Kegiatan Makrab', date: '2023-10-12', sender: 'HMTI', type: 'Proposal', file: 'proposal_makrab.pdf' },
])

// Data Media Event (Simulasi Thumbnail & Video Link)
const mediaData = ref([
  { id: 1, title: 'Makrab 2025', date: '2023-09-15', type: 'Foto', count: 120, thumbnail: 'https://picsum.photos/seed/makrab/400/300' },
  { id: 2, title: 'Seminar Nasional IT', date: '2023-10-01', type: 'Video', count: 3, thumbnail: 'https://picsum.photos/seed/seminar/400/300' },
  { id: 3, title: 'Kunjungan Industri', date: '2023-10-20', type: 'Foto', count: 45, thumbnail: 'https://picsum.photos/seed/kunjungan/400/300' },
])

// Data Branding Kit (Aset Desain)
const brandingData = ref([
  { id: 1, title: 'Logo HMTI Official', type: 'Vector (AI/EPS)', size: '2.4 MB', thumbnail: 'https://via.placeholder.com/400x300?text=Logo+Pack' },
  { id: 2, title: 'Font Resmi', type: 'Font File (TTF/OTF)', size: '500 KB', thumbnail: 'https://via.placeholder.com/400x300?text=Fonts' },
  { id: 3, title: 'Template PPT', type: 'PowerPoint', size: '15 MB', thumbnail: 'https://via.placeholder.com/400x300?text=PPT+Templates' },
])

// --- 3. LOGIC FILTER ---
const filteredLetters = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return lettersData.value.filter(l => 
    l.title.toLowerCase().includes(q) || 
    l.no.toLowerCase().includes(q) ||
    l.type.toLowerCase().includes(q)
  )
})

// --- 4. NAVIGATION LOGIC ---
const goBackToMenu = () => {
  router.push('/admin')
}

const handleLogout = () => {
  if(confirm('Keluar dari Pusat Dokumentasi?')) {
    authStore.logout()
    router.push('/')
  }
}
</script>

<template>
  <div :class="['min-h-screen relative overflow-hidden transition-colors duration-500', themeClasses.bg]">
    
    <!-- BACKGROUND ANIMATION -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob transition-colors duration-500"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 transition-colors duration-500"></div>
    </div>

    <!-- NAVBAR -->
    <nav
      :class="['sticky top-0 z-40 shadow-2xl rounded-b-2xl mb-8 transition-all duration-300', themeClasses.navGlass]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <button @click="goBackToMenu" :class="['transition-colors', themeClasses.btnBack]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m7 7V5a3 3 0 01-3 3h-4M3 8h4a3 3 0 013 3v8a3 3 0 01-3 3h-4a3 3 0 01-3-3V8z">
                </path>
              </svg>
            </button>
            <div
              :class="[
                'font-bold text-xl tracking-wide bg-clip-text text-transparent',
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-200 to-white'
                  : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900'
              ]"
            >
              HMTI
              <span
                :class="[
                  'font-light',
                  isDarkMode ? 'text-blue-200' : 'text-blue-900'
                ]"
              >
                DOCS
              </span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <!-- Theme Toggle (sama seperti FinanceView) -->
            <button @click="isDarkMode = !isDarkMode" class="p-2 rounded-full hover:bg-white/10 transition">
              <span v-if="isDarkMode">☀️</span><span v-else>🌙</span>
            </button>
            <div class="hidden md:block text-right">
              <div :class="['text-sm font-bold', themeClasses.text]">{{ authStore.user ? authStore.user.name : 'User' }}</div>
              <div :class="['text-xs capitalize', themeClasses.textMuted]">{{ authStore.user ? authStore.user.role : 'Guest' }}</div>
            </div>
            <!-- TOMBOL KELUAR (FISIK NYATA) -->
            <button @click="handleLogout"
              class="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">KELUAR</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 py-8">
      
      <!-- HEADER SECTION -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1
            :class="[
              'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text mb-2 leading-tight md:leading-tight break-words whitespace-normal',
              isDarkMode
                ? 'bg-gradient-to-r from-emerald-300 via-white to-emerald-200'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800'
            ]"
          >
            Pusat Dokumentasi
          </h1>
          <p class="text-blue-200 text-lg font-light">Kelola arsip, media, dan aset kreatif dalam satu tempat.</p>
        </div>
        
        <!-- Tombol Kembali (Mobile) -->
        <button @click="goBackToMenu"
          :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
          &larr; Kembali ke Menu
        </button>
      </div>

      <!-- TAB NAVIGATION -->
      <div class="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button @click="activeTab = 'surat'" 
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2', activeTab === 'surat' ? themeClasses.tabActive : themeClasses.tabInactive]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Arsip Surat
        </button>
        <button @click="activeTab = 'media'" 
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2', activeTab === 'media' ? themeClasses.tabActive : themeClasses.tabInactive]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Media Event
        </button>
        <button @click="activeTab = 'branding'" 
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2', activeTab === 'branding' ? themeClasses.tabActive : themeClasses.tabInactive]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          Branding Kit
        </button>
      </div>

      <!-- CONTENT AREA -->
      
      <!-- TAB 1: ARSIP SURAT -->
      <div v-if="activeTab === 'surat'" class="space-y-6">
        
        <!-- Toolbar: Search & Upload -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="relative w-full md:w-1/2">
            <input v-model="searchQuery" type="text" placeholder="Cari No. Surat atau Judul..." 
              :class="['w-full rounded-xl px-4 py-3 pl-12 outline-none transition-all', themeClasses.inputBg]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-4 top-3.5 opacity-50" :class="isDarkMode ? 'text-blue-300' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <button class="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Surat
          </button>
        </div>

        <!-- Upload Zone (Drag & Drop Visual) -->
        <div :class="['border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer hover:border-blue-500/50', isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-50']">
          <div class="text-4xl mb-2">📂</div>
          <h3 :class="['font-bold mb-1', themeClasses.text]">Drag & Drop PDF di sini</h3>
          <p class="text-sm opacity-60">Atau klik tombol Upload di atas</p>
        </div>

        <!-- Tabel Surat -->
        <div :class="['rounded-2xl overflow-hidden border', themeClasses.cardGlass]">
          <table class="w-full text-left">
            <thead :class="['text-xs font-bold uppercase tracking-wider', themeClasses.tableHead]">
              <tr>
                <th class="px-6 py-4">No. Surat</th>
                <th class="px-6 py-4">Judul</th>
                <th class="px-6 py-4">Tanggal</th>
                <th class="px-6 py-4">Pengirim/Tipe</th>
                <th class="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody :class="['text-sm', themeClasses.text]">
              <tr v-for="l in filteredLetters" :key="l.id" :class="['transition duration-150', themeClasses.tableRow]">
                <td class="px-6 py-4 font-mono text-xs opacity-80">{{ l.no }}</td>
                <td class="px-6 py-4 font-bold">{{ l.title }}</td>
                <td class="px-6 py-4">{{ l.date }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="l.type === 'Surat Masuk' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'">
                    {{ l.sender }}
                  </span>
                  <div class="text-xs opacity-50 mt-1">{{ l.type }}</div>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-blue-400 hover:text-blue-300 font-bold text-xs mr-2">Preview</button>
                  <button class="text-slate-400 hover:text-white text-xs">Download</button>
                </td>
              </tr>
              <tr v-if="filteredLetters.length === 0">
                <td colspan="5" class="px-6 py-8 text-center opacity-50">Tidak ada surat ditemukan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: MEDIA EVENT -->
      <div v-if="activeTab === 'media'" class="space-y-6">
        <div class="flex justify-between items-center mb-4">
          <h3 :class="['text-xl font-bold', themeClasses.text]">Galeri Event</h3>
          <button class="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 hover:bg-white/20 transition text-white">
            + Event Baru
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="m in mediaData" :key="m.id" 
               :class="['group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl', themeClasses.cardGlass]">
            
            <!-- Thumbnail / Cover -->
            <div class="h-48 bg-slate-800 relative overflow-hidden">
              <img :src="m.thumbnail" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
              <div class="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border"
                   :class="m.type === 'Video' ? 'bg-red-500/80 border-red-500 text-white' : 'bg-blue-500/80 border-blue-500 text-white'">
                {{ m.type }}
              </div>
              <!-- Play Icon for Video -->
              <div v-if="m.type === 'Video'" class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-1">
                  <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>

            <!-- Info -->
            <div class="p-5">
              <h4 :class="['font-bold text-lg mb-1', themeClasses.text]">{{ m.title }}</h4>
              <p :class="['text-sm opacity-60 mb-3', themeClasses.textMuted]">{{ m.date }}</p>
              <div class="flex justify-between items-center text-xs font-bold opacity-70">
                <span>{{ m.count }} Item</span>
                <span class="text-blue-400 cursor-pointer hover:underline">Lihat Galeri →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: BRANDING KIT -->
      <div v-if="activeTab === 'branding'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="b in brandingData" :key="b.id" 
               class="p-4 rounded-xl border text-center group hover:bg-white/5 transition cursor-pointer"
               :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
            <div class="w-full aspect-video bg-slate-200 rounded-lg mb-3 overflow-hidden">
              <img :src="b.thumbnail" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
            </div>
            <h4 :class="['font-bold text-sm mb-1', themeClasses.text]">{{ b.title }}</h4>
            <p :class="['text-xs opacity-60', themeClasses.textMuted]">{{ b.type }} • {{ b.size }}</p>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style>
/* Animasi Blob */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 10s infinite; }
.animation-delay-2000 { animation-delay: 2s; }

/* Hide Scrollbar for Tabs */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>