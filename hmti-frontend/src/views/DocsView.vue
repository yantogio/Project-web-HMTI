<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import { uploadDocument, getDocuments, deleteDocument } from '../api/documentApi'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// --- 1. STATE UTAMA ---
const docs = ref([])
const isUploading = ref(false)
const fileInput = ref(null)
const activeTab = ref('surat')
const searchQuery = ref('')
const searchQueryMedia = ref('')
const searchQueryBranding = ref('')
const isDarkMode = computed(() => themeStore.isDarkMode)
const allowedUploadRoles = ['ketum', 'bendahara', 'sekretaris']
const canUpload = computed(() => allowedUploadRoles.includes(authStore.user?.role))

// === PAGINATION STATE ===
const currentPage = ref(1)
const itemsPerPage = ref(20)
const totalItems = ref(0)
const totalPages = ref(0)

// --- 1.5 PREVIEW STATE ---
const selectedDoc = ref(null)
const streamUrl = ref('')
const loadingStream = ref(false)
const previewVideoEl = ref(null)

const renderType = computed(() => {
  if (!selectedDoc.value) return null
  const mime = selectedDoc.value.category || ''
  return mime.startsWith('video/') ? 'video' : 'img'
})

const sanitizeText = (text) => {
  if (!text) return ''
  try {
    return decodeURIComponent(encodeURIComponent(text))
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
  } catch (e) { return text }
}

const openPreview = (doc) => {
  selectedDoc.value = doc
  streamUrl.value = getDocumentUrl(doc, 'preview')
}

const openGoogleDrivePreview = (doc) => {
  // Jika ada driveFileId, kita paksa buka Google Drive Previewer di tab baru
  if (doc.driveFileId) {
    window.open(`https://drive.google.com/file/d/${doc.driveFileId}/view`, '_blank');
  } else if (doc.fileUrl) {
    // Fallback jika driveFileId tidak ada
    window.open(doc.fileUrl, '_blank');
  } else {
    alert('Link preview tidak tersedia.');
  }
}

const closePreview = () => {
  // Hanya reset video di preview modal, bukan semua video di halaman
  if (previewVideoEl.value) {
    previewVideoEl.value.pause()
    previewVideoEl.value.src = ''
    previewVideoEl.value.load()
  }
  selectedDoc.value = null
  streamUrl.value = ''
}

// --- 2. API LOGIC ---
const fetchDocs = async (page = 1) => {
  try {
    const res = await getDocuments(page, itemsPerPage.value)
    
    // Handle new pagination response format
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      // New format with pagination
      docs.value = res.data.data || []
      currentPage.value = res.data.pagination?.page || 1
      totalItems.value = res.data.pagination?.total || 0
      totalPages.value = res.data.pagination?.pages || 0
    } else if (Array.isArray(res.data)) {
      // Old format (backward compatibility)
      docs.value = res.data
    } else {
      // Fallback
      docs.value = []
    }
  } catch (err) {
    console.error("Gagal ambil data", err)
    docs.value = []
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
    const msg = err.response?.status === 403 ? 'Hanya Ketua, Bendahara, dan Sekretaris yang dapat upload dokumen.' : 'Gagal upload. Cek koneksi backend!'
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const getDocumentUrl = (doc, action = 'preview') => {
  if (!doc?.id) return doc.fileUrl
  const endpoint = action === 'download' ? 'download' : 'preview'
  return `${apiBaseUrl}/documents/${endpoint}/${doc.id}`
}

const isImage = (mimeType) => mimeType?.startsWith('image/')
const isVideo = (mimeType) => mimeType?.startsWith('video/')

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
  return docs.value.filter(d => d.type === 'MEDIA' && d.title.toLowerCase().includes(searchQueryMedia.value.toLowerCase()))
})

const brandingDocs = computed(() => {
  return docs.value.filter(d => d.type === 'BRANDING' && d.title.toLowerCase().includes(searchQueryBranding.value.toLowerCase()))
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
    bg: 'bg-cream', text: 'text-stone-900', textMuted: 'text-stone-500',
    cardGlass: 'bg-white border border-amber-200/70 shadow-md hover:shadow-lg hover:border-primary-blue/20',
    tableHead: 'bg-cream-light text-stone-600', tableRow: 'hover:bg-cream-light border-b border-amber-100',
    navGlass: 'bg-cream-light/90 backdrop-blur-md border-b border-amber-200',
    inputBg: 'bg-white border-stone-300 text-stone-900 focus:border-primary-blue',
    tabActive: 'bg-gradient-to-r from-primary-blue to-accent-orange text-white', tabInactive: 'bg-white text-stone-600 border border-amber-200',
    btnBack: 'text-primary-blue', btnBackMobile: 'bg-white border-amber-200'
  }
})

const goBackToMenu = () => router.push('/admin')

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
  <AdminPageLayout section="DOCS" accent="emerald" variant="rounded" logout-message="Keluar dari Pusat Dokumentasi?">

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 py-8">
      <input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" accept=".pdf,.docx,.jpg,.jpeg,.png,.MP4" />

      <!-- HEADER SECTION -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 :class="[
            'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text mb-2 leading-tight md:leading-tight break-words whitespace-normal',
            isDarkMode
              ? 'bg-gradient-to-r from-emerald-300 via-white to-emerald-200'
              : 'bg-gradient-to-r from-primary-blue via-accent-orange to-accent-orange'
          ]">
            Pusat Dokumentasi
          </h1>
          <p :class="['text-lg font-light', themeClasses.textMuted]">Kelola arsip, media, dan aset kreatif dalam satu tempat.</p>
        </div>

        <div class="flex flex-col items-end gap-3">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
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

          <div class="w-full md:w-auto">
            <button v-if="canUpload" @click="openFilePicker" :disabled="isUploading"
              :class="['w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30', isUploading ? 'opacity-50 cursor-not-allowed' : '']">
              <span>{{ isUploading ? 'Memproses...' : 'Upload Dokumen' }}</span>
            </button>
            <div v-else :class="['text-sm rounded-xl p-3 border border-dashed', themeClasses.cardGlass, themeClasses.textMuted]">
              Hanya Ketua, Bendahara, dan Sekretaris yang dapat mengunggah dokumen.
            </div>
          </div>
        </div>

        <div v-if="canUpload && !isUploading" @click="openFilePicker" @dragover.prevent @drop.prevent="handleFileUpload"
          class="mt-4 w-full p-8 border-2 border-dashed border-blue-400/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-500/5 transition-all cursor-pointer">
          <p :class="['font-medium', isDarkMode ? 'text-blue-300' : 'text-blue-700']">Klik atau Drop file ke sini</p>
          <p :class="['text-xs text-center', isDarkMode ? 'text-blue-300/70' : 'text-slate-500']">Format: PDF, DOCX, PNG, JPG (Maks. 10MB)</p>
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
                  <div v-if="!l.driveFileId" class="flex items-center text-yellow-500 text-[10px] mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    ID Drive Hilang
                  </div>
                </td>
                <td class="px-6 py-4">{{ new Date(l.uploadDate).toLocaleDateString('id-ID') }}</td>
                <td class="px-6 py-4">
                  <span :class="['px-2 py-1 rounded-md text-[10px] font-bold uppercase', isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700']">
                    {{ l.uploader?.name || 'Sekretaris' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end items-center gap-1">
                    <!-- Preview (for PDF/DOCX, open in new tab via Google Drive link; otherwise, use modal) -->
                    <button @click="
                      l.category === 'application/pdf' || l.category === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ? openGoogleDrivePreview(l)
                        : openPreview(l)
                    "
                      :title="l.category === 'application/pdf' || l.category === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ? 'Preview di Google Drive' : 'Preview'"
                      :class="['p-2 rounded-lg transition-all', isDarkMode ? 'text-blue-400 hover:bg-blue-500/15 hover:text-blue-300' : 'text-blue-600 hover:bg-blue-500/10 hover:text-blue-700']">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <!-- Download -->
                    <a :href="getDocumentUrl(l, 'download')" target="_blank" title="Download"
                      :class="['p-2 rounded-lg transition-all', isDarkMode ? 'text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300' : 'text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700']">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <!-- Hapus (sekretaris only) — hapus DB + Google Drive -->
                    <button v-if="canUpload" @click="deleteDoc(l.id)" title="Hapus (Drive + DB)"
                      :class="['p-2 rounded-lg transition-all', isDarkMode ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300' : 'text-red-500 hover:bg-red-500/10 hover:text-red-600']">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="relative w-full md:w-1/2">
            <input v-model="searchQueryMedia" type="text" placeholder="Cari Judul Media..."
              :class="['w-full rounded-xl px-4 py-3 pl-12 outline-none transition-all', themeClasses.inputBg]" />
          </div>
          <div class="w-full md:w-auto">
            <button v-if="canUpload" @click="openFilePicker" :disabled="isUploading"
              :class="['w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30', isUploading ? 'opacity-50 cursor-not-allowed' : '']">
              <span>{{ isUploading ? 'Memproses...' : '+ Upload Media Event' }}</span>
            </button>
          </div>
        </div>

        <div v-if="mediaDocs.length === 0 && !isUploading" @click="canUpload && openFilePicker()"
          class="w-full py-12 border-2 border-dashed border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 opacity-60" :class="isDarkMode ? 'text-emerald-300' : 'text-emerald-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.586l.828-.828A2 2 0 0110.07 4h3.86a2 2 0 011.664.586l.828.828A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p :class="['font-medium', isDarkMode ? 'text-emerald-300' : 'text-emerald-700']">Belum ada foto. Klik untuk upload dokumentasi pertama!</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="m in mediaDocs" :key="m.id"
            :class="['group relative rounded-2xl overflow-hidden border transition-all hover:scale-[1.02]', themeClasses.cardGlass]">
            <div class="aspect-video w-full overflow-hidden bg-slate-800">
              <template v-if="isVideo(m.category)">
                <video
                  :src="getDocumentUrl(m, 'preview')"
                  class="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  playsinline
                ></video>
              </template>
              <template v-else-if="isImage(m.category)">
                <img
                  :src="getDocumentUrl(m, 'preview')"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt="Preview Asset"
                />
              </template>
              <template v-else>
                <img
                  :src="getPlaceholderImage(m.category)"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt="Preview Asset"
                />
              </template>
            </div>
            <div class="p-4">
              <p :class="['font-bold truncate', themeClasses.text]">{{ sanitizeText(m.title) }}</p>
              <p :class="['text-xs', themeClasses.textMuted]">Oleh: {{ m.uploader?.name || 'Sekretaris' }}</p>
              <div class="flex gap-1.5 mt-3">
                <!-- Preview -->
                <button @click="openPreview(m)" title="Preview"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <!-- Download -->
                <a :href="getDocumentUrl(m, 'download')" target="_blank" title="Download"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <!-- Hapus (sekretaris only) — hapus DB + Google Drive -->
                <button v-if="canUpload" type="button"
                  @click="deleteDoc(m.id)" title="Hapus (Drive + DB)"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

            <!-- TAB 3: BRANDING KIT -->
      <div v-if="activeTab === 'branding'" class="space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="relative w-full md:w-1/2">
            <input v-model="searchQueryBranding" type="text" placeholder="Cari Judul Branding..."
              :class="['w-full rounded-xl px-4 py-3 pl-12 outline-none transition-all', themeClasses.inputBg]" />
          </div>
          <div class="w-full md:w-auto">
            <button v-if="canUpload" @click="openFilePicker" :disabled="isUploading"
              :class="['w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30', isUploading ? 'opacity-50 cursor-not-allowed' : '']">
              <span>{{ isUploading ? 'Memproses...' : '+ Tambah Aset' }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="b in brandingDocs" :key="b.id"
            :class="['p-4 rounded-xl border flex flex-col items-center gap-3 group transition-all', themeClasses.cardGlass]">
            <div class="aspect-square w-full overflow-hidden bg-slate-800 rounded-lg">
              <template v-if="isVideo(b.category)">
                <video
                  :src="getDocumentUrl(b, 'preview')"
                  class="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  playsinline
                ></video>
              </template>
              <template v-else-if="isImage(b.category)">
                <img
                  :src="getDocumentUrl(b, 'preview')"
                  class="w-full h-full object-cover group-hover:scale-105 transition-all"
                  alt="Preview Asset"
                />
              </template>
              <template v-else>
                <img
                  :src="getPlaceholderImage(b.category)"
                  class="w-full h-full object-cover group-hover:scale-105 transition-all"
                  alt="Preview Asset"
                />
              </template>
            </div>
            <div class="text-center w-full">
              <p :class="['font-bold text-sm truncate px-2', themeClasses.text]">{{ sanitizeText(b.title) }}</p>
            </div>
            <div class="flex gap-1.5 w-full mt-1">
              <!-- Preview -->
              <button @click="openPreview(b)" title="Preview"
                class="flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs transition-all bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <!-- Download -->
              <a :href="getDocumentUrl(b, 'download')" target="_blank" title="Download"
                class="flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs transition-all bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <!-- Hapus (sekretaris only) — hapus DB + Google Drive -->
              <button v-if="canUpload" type="button"
                @click="deleteDoc(b.id)" title="Hapus (Drive + DB)"
                class="flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs transition-all bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </main>

  </AdminPageLayout>

  <!-- GLOBAL PREVIEW MODAL — di-teleport ke body agar berada di atas semua elemen termasuk header & SpeedDial -->
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
        v-if="selectedDoc"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 backdrop-blur-md p-4"
        @click.self="closePreview"
      >
        <!-- Tombol tutup -->
        <button
          @click="closePreview"
          class="fixed top-5 right-5 z-[10000] p-3 text-white bg-red-600 hover:bg-red-700 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Konten preview -->
        <div class="flex flex-col items-center gap-5 w-full max-w-5xl mx-auto">

          <!-- Video responsive -->
          <video
            v-if="renderType === 'video'"
            ref="previewVideoEl"
            :src="streamUrl"
            class="rounded-xl shadow-2xl border border-white/10 w-full max-h-[72vh]"
            style="object-fit: contain;"
            controls
            autoplay
          ></video>

          <!-- Gambar responsive -->
          <img
            v-else-if="renderType === 'img'"
            :src="streamUrl"
            class="rounded-xl shadow-2xl border border-white/10 max-h-[76vh] max-w-full w-auto h-auto"
            style="object-fit: contain;"
            alt="Preview"
          />

          <!-- Info dokumen — latar gelap eksplisit agar teks selalu terbaca di mode apapun -->
          <div class="shrink-0 text-center bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/10">
            <h3 class="text-xl md:text-2xl font-black tracking-tight text-white">{{ sanitizeText(selectedDoc.title) }}</h3>
            <p class="text-sm text-blue-200/70 mt-1 uppercase font-bold tracking-wider">{{ selectedDoc.category }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

