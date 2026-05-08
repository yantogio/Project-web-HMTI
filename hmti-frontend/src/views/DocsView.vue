<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { uploadDocument, getDocuments, deleteDocument } from '../api/documentApi'

const router = useRouter()
const authStore = useAuthStore()

// --- 1. STATE UTAMA ---
const docs = ref([])           // Data dari database
const mediaData = ref([])      // Inisialisasi array kosong agar tidak error
const brandingData = ref([])   // Inisialisasi array kosong agar tidak error
const isUploading = ref(false)
const fileInput = ref(null)
const activeTab = ref('surat')
const searchQuery = ref('')
const isDarkMode = ref(true)

// --- 2. API LOGIC ---
const fetchDocs = async () => {
  try {
    const res = await getDocuments() // Pastikan fungsi ini ada di documentApi.js
    docs.value = res.data
  } catch (err) {
    console.error("Gagal ambil data", err)
  }
}

onMounted(() => {
  fetchDocs()
})

const handleFileUpload = async (event) => {
  // Mengambil file dari input klik atau drag & drop
  const file = event.target.files?.[0] || event.dataTransfer?.files?.[0]
  if (!file) return

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', file.name)

  // LOGIC MAPPING: Menyesuaikan tab aktif dengan Type di Database
  let docType = 'SURAT_KELUAR'
  if (activeTab.value === 'media') docType = 'MEDIA'
  if (activeTab.value === 'branding') docType = 'BRANDING'
  formData.append('type', docType)

  try {
    await uploadDocument(formData)
    alert('Upload Berhasil, sob!')
    fetchDocs()
  } catch (err) {
    const msg = err.response?.status === 403 ? 'Waduh, cuma Sekretaris yang boleh upload!' : 'Gagal upload. Cek koneksi backend!'
    alert(msg)
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = '' // Reset input file supaya bisa upload file yang sama
  }
}

const deleteDoc = async (id) => {
  if (!confirm('Yakin mau hapus dokumen ini, sob?')) return

  try {
    await deleteDocument(id)
    alert('Berhasil dihapus!')
    await fetchDocs()
  } catch (err) {
    console.error(err)
    alert('Gagal hapus, cuk! Cek console.')
  }
}

const getDriveFileId = (url) => {
  if (!url) return ''

  return (
    url.match(/\/d\/([-\w]{25,})/)?.[1] ||
    url.match(/[?&]id=([-\w]{25,})/)?.[1] ||
    url.match(/[-\w]{25,}/)?.[0] ||
    ''
  )
}

const openFilePicker = () => {
  fileInput.value?.click()
}

// --- 3. FILTER & THEME ---
const filteredDocs = computed(() => {
  return docs.value.filter(d =>
    d.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Filter data berdasarkan tab aktif
const suratDocs = computed(() => {
  return filteredDocs.value.filter(d => d.type === 'SURAT_KELUAR')
})

const mediaDocs = computed(() => {
  return filteredDocs.value.filter(d => d.type === 'MEDIA')
})

const brandingDocs = computed(() => {
  return filteredDocs.value.filter(d => d.type === 'BRANDING')
})

const themeClasses = computed(() => {
  return isDarkMode.value ? {
    bg: 'bg-slate-900', text: 'text-white', textMuted: 'text-blue-200/60',
    cardGlass: 'bg-slate-800/40 border border-white/10 backdrop-blur-md',
    tableHead: 'bg-slate-700/50 text-blue-200', tableRow: 'hover:bg-white/5 border-b border-white/5',
    navGlass: 'bg-white/10 backdrop-blur-md border-b border-white/10',
    inputBg: 'bg-white/5 border-white/10 text-white focus:border-blue-500',
    tabActive: 'bg-blue-600 text-white shadow-lg', tabInactive: 'bg-white/5 text-blue-200',
    btnBack: 'text-blue-200 hover:text-white', btnBackMobile: 'bg-white/10'
  } : {
    bg: 'bg-slate-50', text: 'text-slate-900', textMuted: 'text-slate-500',
    cardGlass: 'bg-white border border-slate-200 shadow-sm',
    tableHead: 'bg-slate-50 text-slate-600', tableRow: 'hover:bg-slate-50 border-b border-slate-100',
    navGlass: 'bg-white/80 border-b border-slate-200',
    inputBg: 'bg-white border-slate-300 text-slate-900 focus:border-blue-500',
    tabActive: 'bg-blue-600 text-white', tabInactive: 'bg-white text-slate-600 border border-slate-200',
    btnBack: 'text-blue-600', btnBackMobile: 'bg-white'
  }
})

const goBackToMenu = () => router.push('/admin')
const handleLogout = () => {
  if (confirm('Keluar dari Pusat Dokumentasi?')) {
    authStore.logout()
    router.push('/')
  }
}

// --- FUNGSI PREVIEW BARU ---
const getPlaceholderImage = (mimeType) => {
  if (!mimeType) return new URL('../assets/Images/Preview Lainnya.png', import.meta.url).href

  if (mimeType.includes('image')) {
    return new URL('../assets/Images/Preview Foto.jpeg', import.meta.url).href
  } 
  if (mimeType.includes('video')) {
    return new URL('../assets/Images/Preview Video.png', import.meta.url).href
  }
  return new URL('../assets/Images/Preview Lainnya.png', import.meta.url).href
}

</script>

<template>
  <div :class="['min-h-screen relative overflow-hidden transition-colors duration-500', themeClasses.bg]">

    <!-- BACKGROUND ANIMATION -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div
        class="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob transition-colors duration-500">
      </div>
      <div
        class="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 transition-colors duration-500">
      </div>
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
            <div :class="[
              'font-bold text-xl tracking-wide bg-clip-text text-transparent',
              isDarkMode
                ? 'bg-gradient-to-r from-blue-200 to-white'
                : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900'
            ]">
              HMTI
              <span :class="[
                'font-light',
                isDarkMode ? 'text-blue-200' : 'text-blue-900'
              ]">
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
              <div :class="['text-sm font-bold', themeClasses.text]">{{ authStore.user ? authStore.user.name : 'User' }}
              </div>
              <div :class="['text-xs capitalize', themeClasses.textMuted]">{{ authStore.user ? authStore.user.role :
                'Guest' }}</div>
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
      <input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" accept=".pdf,.docx,.jpg,.png,.MP4" />

      <!-- HEADER SECTION -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 :class="[
            'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text mb-2 leading-tight md:leading-tight break-words whitespace-normal',
            isDarkMode
              ? 'bg-gradient-to-r from-emerald-300 via-white to-emerald-200'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800'
          ]">
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
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Arsip Surat
        </button>
        <button @click="activeTab = 'media'"
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2', activeTab === 'media' ? themeClasses.tabActive : themeClasses.tabInactive]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Media Event
        </button>
        <button @click="activeTab = 'branding'"
          :class="['px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2', activeTab === 'branding' ? themeClasses.tabActive : themeClasses.tabInactive]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Branding Kit
        </button>
      </div>

      <!-- CONTENT AREA -->

      <!-- TAB 1: ARSIP SURAT -->
      <div v-if="activeTab === 'surat'" class="space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="relative w-full md:w-1/2">
            <input v-model="searchQuery" type="text" placeholder="Cari Judul Dokumen..."
              :class="['w-full rounded-xl px-4 py-3 pl-12 outline-none transition-all', themeClasses.inputBg]">
          </div>

          <button @click="openFilePicker" :disabled="isUploading"
            :class="['w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30', isUploading ? 'opacity-50 cursor-not-allowed' : '']">
            <span>{{ isUploading ? 'Memproses...' : 'Upload Dokumen' }}</span>
          </button>
        </div>

        <div v-if="!isUploading" @click="openFilePicker" @dragover.prevent @drop.prevent="handleFileUpload"
          class="mt-4 w-full p-8 border-2 border-dashed border-blue-400/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-500/5 transition-all cursor-pointer">
          <p class="text-blue-400 font-medium">Klik atau Drop file ke sini</p>
          <p class="text-xs text-blue-400/60 text-center">Format: PDF, DOCX, PNG, JPG (Maks. 10MB)</p>
        </div>

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
              <tr v-for="(l, index) in suratDocs" :key="l.id"
                :class="['transition duration-150', themeClasses.tableRow]">
                <td class="px-6 py-4 font-medium">{{ index + 1 }}</td>
                <td class="px-6 py-4">
                  <div class="font-bold">{{ l.title }}</div>
                  <div class="text-xs opacity-60">{{ l.category }}</div>
                </td>
                <td class="px-6 py-4">{{ new Date(l.uploadDate).toLocaleDateString('id-ID') }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs">
                    {{ l.uploader?.name || 'Sekretaris' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-3">
                    <a :href="l.fileUrl" target="_blank" class="text-emerald-400 hover:text-emerald-300 font-bold">Buka
                      File →</a>
                    <button v-if="authStore.user?.role === 'sekretaris'" @click="deleteDoc(l.id)"
                      class="text-red-400 hover:text-red-500">Hapus</button>
                  </div>
                </td>
              </tr>
              <tr v-if="suratDocs.length === 0">
                <td colspan="5" class="px-6 py-8 text-center opacity-50">Tidak ada dokumen ditemukan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

            <!-- TAB 2: MEDIA -->
      <div v-if="activeTab === 'media'" class="space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h3 :class="['text-xl font-bold', themeClasses.text]">Galeri Event HMTI</h3>
            <p :class="['text-sm', themeClasses.textMuted]">Dokumentasi visual setiap kegiatan himpunan.</p>
          </div>
          <button @click="openFilePicker" :disabled="isUploading"
            :class="['px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30', isUploading ? 'opacity-50' : '']">
            <span>{{ isUploading ? 'Uploading...' : '+ Upload Foto Event' }}</span>
          </button>
        </div>

        <div v-if="mediaDocs.length === 0 && !isUploading" @click="openFilePicker"
          class="w-full py-12 border-2 border-dashed border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/5 cursor-pointer transition-all">
          <span class="text-3xl">📸</span>
          <p class="text-emerald-400 font-medium">Belum ada foto. Klik untuk upload dokumentasi pertama!</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="m in mediaDocs" :key="m.id"
            :class="['group relative rounded-2xl overflow-hidden border transition-all hover:scale-[1.02]', themeClasses.cardGlass]">
            <div class="aspect-video w-full overflow-hidden bg-slate-800">
              <img 
                :src="getPlaceholderImage(m.category)" 
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt="Preview Asset"
              >
            </div>
            <div class="p-4">
              <p :class="['font-bold truncate', themeClasses.text]">{{ m.title }}</p>
              <p :class="['text-xs', themeClasses.textMuted]">Oleh: {{ m.uploader?.name || 'Sekretaris' }}</p>
              <div class="flex gap-2 mt-3">
                <a :href="m.fileUrl" target="_blank"
                  class="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all">Lihat
                  Full</a>
                <button v-if="authStore.user?.role === 'sekretaris'" @click="deleteDoc(m.id)"
                  class="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

            <!-- TAB 3: BRANDING KIT -->
      <div v-if="activeTab === 'branding'" class="space-y-6">
        <div class="flex justify-between items-center mb-6">
          <h3 :class="['text-xl font-bold', themeClasses.text]">Aset Branding HMTI</h3>
          <button @click="openFilePicker" :disabled="isUploading"
            :class="['px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30', isUploading ? 'opacity-50' : '']">
            <span>{{ isUploading ? 'Uploading...' : '+ Tambah Aset' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="b in brandingDocs" :key="b.id"
            :class="['p-4 rounded-xl border flex flex-col items-center gap-3 group transition-all', themeClasses.cardGlass]">
            <div class="aspect-square w-full overflow-hidden bg-slate-800 rounded-lg">
              <img 
                :src="getPlaceholderImage(b.category)" 
                class="w-full h-full object-cover group-hover:scale-105 transition-all"
                alt="Preview Asset"
              >
            </div>
            <div class="text-center w-full">
              <p :class="['font-bold text-sm truncate px-2', themeClasses.text]">{{ b.title }}</p>
            </div>
            <div class="flex flex-col w-full gap-2">
              <a :href="b.fileUrl" target="_blank"
                class="w-full py-2 bg-white/5 hover:bg-white/10 text-center rounded-lg text-xs font-bold transition-all border border-white/5">Download</a>
              <button v-if="authStore.user?.role === 'sekretaris'" @click="deleteDoc(b.id)"
                class="text-[10px] text-red-400 hover:underline">Hapus Aset</button>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style>
/* Animasi Blob */
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

/* Hide Scrollbar for Tabs */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>