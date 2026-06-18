<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const shortcutItems = [
  { to: '/admin/members', label: 'Anggota', desc: 'Lihat data anggota' },
  { to: '/admin/finance', label: 'Keuangan', desc: 'Kelola kas & iuran' },
  { to: '/admin/docs', label: 'Dokumentasi', desc: 'Akses arsip dan file' },
  { to: '/admin/showcase', label: 'Showcase', desc: 'Tampilan konten publik' },
  { to: '/admin/profile', label: 'Profil', desc: 'Edit profil akun' }
]

// --- 1. STATE & THEME ---
const isDarkMode = computed(() => themeStore.isDarkMode)
const activeTab = ref('prestasi') // 'prestasi', 'event', 'kegiatan'
const isMediaModalOpen = ref(false)

// Form State
const formData = ref({
  title: '',
  description: '',
  level: '', // Khusus Prestasi
  date: '', // Khusus Event
  winner: '', // Khusus Prestasi (Opsional)
  featured: false, // Featured System
  mediaSource: 'upload', // 'upload' atau 'gallery'
  imageUrl: ''
})

const sanitizeText = (text) => {
  if (!text) return ''
  try {
    return decodeURIComponent(encodeURIComponent(text))
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
  } catch (e) { return text }
}

// Theme Classes
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      textMuted: 'text-blue-200/60',
      cardGlass: 'bg-slate-800/40 border border-white/10 hover:border-white/20 backdrop-blur-md',
      inputBg: 'bg-white/5 border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500 focus:bg-white/10',
      navGlass: 'bg-white/10 backdrop-blur-md border-b border-white/10',
      tabActive: 'bg-purple-600 text-white shadow-lg shadow-purple-500/40',
      tabInactive: 'bg-white/5 text-blue-200 hover:bg-white/10',
      btnBack: 'text-blue-200 hover:text-white',
      btnBackMobile: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
      textLightModeFix: 'text-white' // Dark mode biasanya putih
    }
  } else {
    return {
      bg: 'bg-cream',
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      cardGlass: 'bg-white border border-amber-200/70 hover:border-primary-blue/30 hover:shadow-lg shadow-md backdrop-blur-sm',
      inputBg: 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-blue focus:bg-white',
      navGlass: 'bg-cream-light/90 backdrop-blur-md border-b border-amber-200 shadow-sm',
      tabActive: 'bg-gradient-to-r from-primary-blue to-accent-orange text-white shadow-lg shadow-primary-blue/25',
      tabInactive: 'bg-white text-stone-600 hover:bg-cream-light border border-amber-200',
      btnBack: 'text-primary-blue hover:text-primary-blue-dark',
      btnBackMobile: 'bg-white text-stone-700 border-amber-200 hover:bg-cream-light',
      textLightModeFix: 'text-transparent bg-clip-text bg-gradient-to-r from-primary-blue via-accent-orange to-accent-orange'
    }
  }
})

// --- 2. DATA DUMMY ---
const showcaseItems = ref([
  { 
    id: 1, category: 'prestasi', title: 'Juara 1 Hackathon Nasional', 
    desc: 'Tim HMTI berhasil meraih emas di kompetisi hacking nasional.', 
    level: 'Juara 1 Nasional', date: '2023-10-01', 
    featured: true, img: 'https://picsum.photos/seed/trophy/400/250' 
  },
  { 
    id: 2, category: 'event', title: 'Seminar Teknologi AI', 
    desc: 'Workshop mengenai perkembangan Artificial Intelligence.', 
    level: '', date: '2023-11-15', 
    featured: false, img: 'https://picsum.photos/seed/ai/400/250' 
  },
  { 
    id: 3, category: 'kegiatan', title: 'Bakti Sosial Desa Binaan', 
    desc: 'Mengajar komputer dasar kepada anak-anak desa.', 
    level: '', date: '2023-09-20', 
    featured: true, img: 'https://picsum.photos/seed/baksos/400/250' 
  },
  // Prestasi tambahan
  { 
    id: 4, category: 'prestasi', title: 'Finalis Gemastik UI/UX', 
    desc: 'Tim desain HMTI lolos sebagai finalis di ajang Gemastik kategori UI/UX.', 
    level: 'Finalis Nasional', date: '2023-08-10', 
    featured: false, img: 'https://picsum.photos/seed/uiux/400/250' 
  },
  { 
    id: 5, category: 'prestasi', title: 'Best Paper Konferensi IT', 
    desc: 'Paper penelitian tentang keamanan jaringan meraih predikat Best Paper.', 
    level: 'Best Paper', date: '2023-07-22', 
    featured: true, img: 'https://picsum.photos/seed/paper/400/250' 
  },
  // Event tambahan
  { 
    id: 6, category: 'event', title: 'Tech Talk: Cloud Computing', 
    desc: 'Diskusi santai seputar arsitektur cloud dan praktik DevOps.', 
    level: '', date: '2023-12-05', 
    featured: false, img: 'https://picsum.photos/seed/cloud/400/250' 
  },
  { 
    id: 7, category: 'event', title: 'Workshop Web Modern', 
    desc: 'Pelatihan membangun aplikasi web modern dengan Vue dan Tailwind.', 
    level: '', date: '2024-01-15', 
    featured: true, img: 'https://picsum.photos/seed/web/400/250' 
  },
  // Kegiatan tambahan
  { 
    id: 8, category: 'kegiatan', title: 'Sharing Session Alumni', 
    desc: 'Alumni HMTI berbagi pengalaman kerja di industri teknologi.', 
    level: '', date: '2023-11-01', 
    featured: false, img: 'https://picsum.photos/seed/alumni/400/250' 
  },
  { 
    id: 9, category: 'kegiatan', title: 'Pelatihan Dasar Linux', 
    desc: 'Pengenalan sistem operasi Linux untuk anggota baru.', 
    level: '', date: '2023-10-18', 
    featured: false, img: 'https://picsum.photos/seed/linux/400/250' 
  },
])

// Filter items based on Tab
const filteredItems = computed(() => {
  return showcaseItems.value.filter(item => item.category === activeTab.value)
})

// --- 3. LOGIC ---
const goBackToMenu = () => router.push('/admin')

const handleLogout = () => {
  if(confirm('Keluar dari Showcase Hub?')) {
    authStore.logout()
    router.push('/')
  }
}

const submitForm = () => {
  alert('Konten berhasil ditambahkan! (Simulasi)')
  // Reset form
  formData.value = { title: '', description: '', level: '', date: '', winner: '', featured: false, mediaSource: 'upload', imageUrl: '' }
}

const selectImageFromGallery = (url) => {
  formData.value.imageUrl = url
  isMediaModalOpen.value = false
}
</script>

<template>
  <AdminPageLayout section="SHOWCASE" accent="purple" variant="rounded" logout-message="Keluar dari Showcase Hub?">

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 py-8">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <!-- PERBAIKAN WARNA JUDUL DI MODE TERANG (textLightModeFix) -->
          <h1
            class="text-4xl md:text-5xl font-extrabold mb-2 leading-tight md:leading-tight break-words whitespace-normal"
            :class="isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-200' : themeClasses.textLightModeFix">
            Kelola Konten Publik
          </h1>
          <p class="text-blue-200 text-lg font-light" :class="isDarkMode ? '' : 'text-slate-600'">Atur apa yang dilihat pengunjung di halaman depan.</p>
        </div>
        
        <div class="flex flex-col items-end gap-3">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="flex gap-4 mb-8">
        <button @click="activeTab = 'prestasi'" 
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2', activeTab === 'prestasi' ? themeClasses.tabActive : themeClasses.tabInactive]">
          🏆 Prestasi
        </button>
        <button @click="activeTab = 'event'" 
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2', activeTab === 'event' ? themeClasses.tabActive : themeClasses.tabInactive]">
          📅 Event
        </button>
        <button @click="activeTab = 'kegiatan'" 
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2', activeTab === 'kegiatan' ? themeClasses.tabActive : themeClasses.tabInactive]">
          📝 Kegiatan
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- LEFT COLUMN: SMART FORM (INPUT) -->
        <div class="lg:col-span-1">
          <div :class="['p-6 rounded-2xl border sticky top-24', themeClasses.cardGlass]">
            <h3 :class="['text-xl font-bold mb-6', themeClasses.text]">Tambah {{ activeTab === 'prestasi' ? 'Prestasi' : activeTab === 'event' ? 'Event' : 'Kegiatan' }}</h3>
            
            <div class="space-y-4">
              <!-- Input Umum -->
              <div>
                <label class="block text-xs font-bold uppercase opacity-70 mb-1">Judul</label>
                <input type="text" v-model="formData.title" placeholder="Masukkan judul..." 
                  :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
              </div>
              
              <div>
                <label class="block text-xs font-bold uppercase opacity-70 mb-1">Deskripsi</label>
                <textarea v-model="formData.description" rows="3" placeholder="Deskripsi singkat..." 
                  :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg]"></textarea>
              </div>

              <!-- SMART FIELD: KHUSUS PRESTASI -->
              <div v-if="activeTab === 'prestasi'" class="space-y-4 animate-fade-in">
                <div>
                  <label class="block text-xs font-bold uppercase opacity-70 mb-1">Tingkat Prestasi</label>
                  <select v-model="formData.level" 
                    :class="['w-full rounded-xl px-4 py-3 outline-none transition-all cursor-pointer', themeClasses.inputBg]">
                    <option value="" :class="isDarkMode ? 'text-slate-800' : 'text-slate-900'">Pilih Tingkat...</option>
                    <option value="Juara 1" :class="isDarkMode ? 'text-slate-800' : 'text-slate-900'">Juara 1</option>
                    <option value="Juara 2" :class="isDarkMode ? 'text-slate-800' : 'text-slate-900'">Juara 2</option>
                    <option value="Juara 3" :class="isDarkMode ? 'text-slate-800' : 'text-slate-900'">Juara 3</option>
                    <option value="Nasional" :class="isDarkMode ? 'text-slate-800' : 'text-slate-900'">Nasional</option>
                    <option value="Internasional" :class="isDarkMode ? 'text-slate-800' : 'text-slate-900'">Internasional</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase opacity-70 mb-1">Pemenang (Nama Tim/Individu)</label>
                  <input type="text" v-model="formData.winner" placeholder="Contoh: Tim HMTI Coding" 
                    :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
                </div>
              </div>

              <!-- SMART FIELD: KHUSUS EVENT -->
              <div v-if="activeTab === 'event'" class="animate-fade-in">
                <label class="block text-xs font-bold uppercase opacity-70 mb-1">Tanggal Pelaksanaan</label>
                <input type="date" v-model="formData.date" 
                  :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
              </div>

              <!-- MEDIA PICKER -->
              <div>
                <label class="block text-xs font-bold uppercase opacity-70 mb-2">Media Utama</label>
                <div class="flex gap-2 mb-3">
                  <button @click="formData.mediaSource = 'upload'" 
                    :class="['flex-1 py-2 rounded-lg text-xs font-bold border transition-all', formData.mediaSource === 'upload' ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-600/30 text-slate-400']">
                    Upload Baru
                  </button>
                  <button @click="isMediaModalOpen = true; formData.mediaSource = 'gallery'" 
                    :class="['flex-1 py-2 rounded-lg text-xs font-bold border transition-all', formData.mediaSource === 'gallery' ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-600/30 text-slate-400']">
                    Pilih dari Docs
                  </button>
                </div>
                <!-- Preview Image -->
                <div v-if="formData.imageUrl" class="w-full h-32 rounded-lg overflow-hidden border border-white/10 relative group">
                  <img :src="formData.imageUrl" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span class="text-xs text-white font-bold">Ganti</span>
                  </div>
                </div>
              </div>

              <!-- FEATURED SYSTEM (PIN TO FRONT) -->
              <div class="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                <div>
                  <div :class="['text-sm font-bold', themeClasses.text]">Pin to Front</div>
                  <div :class="['text-xs opacity-60', themeClasses.textMuted]">Tampilkan di HomeView</div>
                </div>
                <!-- Toggle Switch -->
                <button @click="formData.featured = !formData.featured"
                  class="w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none"
                  :class="formData.featured ? 'bg-purple-500' : 'bg-slate-600'">
                  <div class="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out"
                    :class="formData.featured ? 'translate-x-6' : 'translate-x-0'"></div>
                </button>
              </div>

              <button @click="submitForm" 
                class="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-500/30">
                Simpan Konten
              </button>

            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: LIST ITEM -->
        <div class="lg:col-span-2 space-y-6">
          <div class="flex justify-between items-center">
            <h3 :class="['text-xl font-bold', themeClasses.text]">Daftar {{ activeTab }}</h3>
            <span :class="['text-xs font-bold px-2 py-1 rounded', themeClasses.cardGlass]">{{ filteredItems.length }} Item</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="item in filteredItems" :key="item.id" 
                 :class="['rounded-xl overflow-hidden border group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl', themeClasses.cardGlass]">
              
              <!-- Thumbnail -->
              <div class="h-40 bg-slate-800 relative">
                <img :src="item.img" class="w-full h-full object-cover">
                
                <!-- Featured Badge -->
                <div v-if="item.featured" class="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  PINNED
                </div>
              </div>

              <!-- Content -->
              <div class="p-4">
                <h4 :class="['font-bold text-lg mb-1 truncate', themeClasses.text]">{{ sanitizeText(item.title) }}</h4>
                <p :class="['text-sm opacity-70 line-clamp-2 mb-3', themeClasses.textMuted]">{{ sanitizeText(item.desc) }}</p>
                
                <!-- Dynamic Meta Info -->
                <div class="flex items-center justify-between text-xs font-bold opacity-60">
                  <span v-if="item.level" class="text-yellow-400">🏆 {{ item.level }}</span>
                  <span v-if="item.date" class="text-blue-400">📅 {{ item.date }}</span>
                  <span v-if="!item.level && !item.date">📝 Kegiatan Umum</span>
                  <button class="text-red-400 hover:text-red-300">Hapus</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- MEDIA PICKER MODAL (GALLERY SIMULATION) -->
    <div v-if="isMediaModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="isMediaModalOpen = false"></div>
      
      <div :class="['relative w-full max-w-4xl border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col', isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200']">
        <div class="flex justify-between items-center mb-6">
          <h3 :class="['text-2xl font-black', themeClasses.text]">Pilih Media Dokumentasi</h3>
          <button @click="isMediaModalOpen = false" 
                  class="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Dummy Gallery Items -->
          <div v-for="i in 8" :key="i" @click="selectImageFromGallery(`https://picsum.photos/seed/gallery${i}/400/300`)" 
               class="aspect-video bg-slate-800 rounded-lg cursor-pointer hover:ring-2 hover:ring-purple-500 transition overflow-hidden group">
            <img :src="`https://picsum.photos/seed/gallery${i}/400/300`" class="w-full h-full object-cover group-hover:scale-110 transition">
          </div>
        </div>
      </div>
    </div>
  </AdminPageLayout>
</template>

