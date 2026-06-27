<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import axios from 'axios'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
const { confirm: confirmDialog } = useConfirm()

const BASE = 'http://localhost:3000'
const authHeader = computed(() => ({ Authorization: `Bearer ${authStore.token}` }))

// --- STATE ---
const isDarkMode = computed(() => themeStore.isDarkMode)
const activeTab = ref('prestasi')
const showcaseItems = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isMediaModalOpen = ref(false)
const galleryDocs = ref([])
const isLoadingGallery = ref(false)

// --- PREVIEW MODAL STATE ---
const selectedItem = ref(null)
const previewVideoEl = ref(null)

const previewRenderType = computed(() => {
  const doc = selectedItem.value?.document
  if (!doc) return 'img'
  if (doc.category?.startsWith('video/') || isVideo(doc.type || doc.category)) return 'video'
  return 'img'
})

const getDocPreviewUrl = (docId) => docId ? `${BASE}/documents/preview/${docId}` : null

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

const formData = ref({
  title: '',
  description: '',
  dateTime: '',
  isVisible: true,
  mediaSource: 'upload',
  documentId: null,
  file: null,
})
const fileInputRef = ref(null)

// --- THEME ---
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      text: 'text-white',
      textMuted: 'text-blue-200/60',
      cardGlass: 'bg-slate-800/40 border border-white/10 hover:border-white/20 backdrop-blur-md',
      inputBg: 'bg-white/5 border border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500 focus:bg-white/10',
      tabActive: 'bg-purple-600 text-white shadow-lg shadow-purple-500/40',
      tabInactive: 'bg-white/5 text-blue-200 hover:bg-white/10',
      btnBackMobile: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
      textLightModeFix: 'text-white',
      sectionLabel: 'text-purple-400',
      pinBg: 'bg-white/5 border-white/10',
    }
  } else {
    return {
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      cardGlass: 'bg-white border border-amber-200/70 hover:border-primary-blue/30 hover:shadow-lg shadow-md backdrop-blur-sm',
      inputBg: 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-blue',
      tabActive: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25',
      tabInactive: 'bg-white text-stone-600 hover:bg-cream-light border border-amber-200',
      btnBackMobile: 'bg-white text-stone-700 border-amber-200 hover:bg-cream-light',
      textLightModeFix: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600',
      sectionLabel: 'text-purple-600',
      pinBg: 'bg-cream-light border-amber-200',
    }
  }
})

// --- HELPERS ---
const sanitizeText = (text) => {
  if (!text) return ''
  try { return decodeURIComponent(encodeURIComponent(text)).replace(/[^\x20-\x7E -￿]/g, '') }
  catch (e) { return text }
}

const getDocUrl = (docId) => docId ? `${BASE}/documents/download/${docId}` : null

const isImage = (cat) => cat && ['FOTO', 'MEDIA', 'BRANDING', 'IMAGE'].includes(cat?.toUpperCase())
const isVideo = (cat) => cat && ['VIDEO', 'REKAMAN'].includes(cat?.toUpperCase())

const formatDate = (dt) => {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// --- DATA FETCHING ---
const fetchItems = async () => {
  isLoading.value = true
  try {
    const res = await axios.get(`${BASE}/showcase`, { headers: authHeader.value })
    showcaseItems.value = res.data
  } catch (e) {
    toastError('Gagal memuat data showcase.')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const fetchGalleryDocs = async () => {
  isLoadingGallery.value = true
  try {
    const res = await axios.get(`${BASE}/documents?limit=100`, { headers: authHeader.value })
    // findAll mengembalikan { data: [...], pagination: {...} }
    const docs = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
    galleryDocs.value = docs.filter(d =>
      ['FOTO', 'MEDIA', 'BRANDING', 'VIDEO', 'IMAGE'].includes((d.type || d.category || '').toUpperCase())
    )
  } catch (e) {
    toastError('Gagal memuat galeri dokumen.')
    console.error(e)
  } finally {
    isLoadingGallery.value = false
  }
}

// --- COMPUTED ---
const filteredItems = computed(() =>
  showcaseItems.value.filter(item => item.category === activeTab.value)
)

const pinnedCount = computed(() =>
  filteredItems.value.filter(i => i.isVisible).length
)

// --- FORM ---
const goBackToMenu = () => router.push('/admin')

const resetForm = () => {
  formData.value = { title: '', description: '', dateTime: '', isVisible: true, mediaSource: 'upload', documentId: null, file: null }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const onFileChange = (e) => {
  const f = e.target.files?.[0]
  if (f) formData.value.file = f
}

const openGallery = async () => {
  isMediaModalOpen.value = true
  if (galleryDocs.value.length === 0) await fetchGalleryDocs()
}

const selectFromGallery = (doc) => {
  formData.value.documentId = doc.id
  formData.value.file = null
  formData.value.mediaSource = 'gallery'
  isMediaModalOpen.value = false
}

const submitForm = async () => {
  if (!formData.value.title.trim()) {
    toastWarning('Judul tidak boleh kosong.')
    return
  }
  isSubmitting.value = true
  try {
    const payload = new FormData()
    payload.append('category', activeTab.value)
    payload.append('title', formData.value.title)
    payload.append('description', formData.value.description || '')
    payload.append('isVisible', String(formData.value.isVisible))
    if (formData.value.dateTime) payload.append('dateTime', formData.value.dateTime)
    if (formData.value.file) {
      payload.append('file', formData.value.file)
    } else if (formData.value.documentId) {
      payload.append('documentId', String(formData.value.documentId))
    }
    await axios.post(`${BASE}/showcase`, payload, {
      headers: { ...authHeader.value, 'Content-Type': 'multipart/form-data' }
    })
    toastSuccess('Konten berhasil ditambahkan!')
    resetForm()
    await fetchItems()
  } catch (e) {
    toastError('Gagal menyimpan konten.')
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}

// --- ITEM ACTIONS ---
const togglePin = async (item) => {
  try {
    const res = await axios.put(`${BASE}/showcase/${item.id}/toggle`, {}, { headers: authHeader.value })
    const idx = showcaseItems.value.findIndex(i => i.id === item.id)
    if (idx !== -1) showcaseItems.value[idx] = res.data
    toastSuccess(res.data.isVisible ? 'Item dipinned ke beranda!' : 'Item disembunyikan dari beranda.')
  } catch (e) {
    toastError('Gagal mengubah status tampil.')
  }
}

const deleteItem = async (item) => {
  const ok = await confirmDialog(`Hapus "${item.title}" dari showcase?`)
  if (!ok) return
  try {
    await axios.delete(`${BASE}/showcase/${item.id}`, { headers: authHeader.value })
    showcaseItems.value = showcaseItems.value.filter(i => i.id !== item.id)
    toastSuccess('Item berhasil dihapus.')
  } catch (e) {
    toastError('Gagal menghapus item.')
  }
}

// --- ANIMATIONS ---
let scrollObserver = null
const setupScrollAnimations = () => {
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        entry.target.querySelectorAll('.stagger-child').forEach((child, i) => {
          setTimeout(() => child.classList.add('is-visible'), i * 100)
        })
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' })
  document.querySelectorAll('.scroll-reveal').forEach(el => scrollObserver.observe(el))
}

onMounted(async () => {
  await fetchItems()
  await nextTick()
  setupScrollAnimations()
})

onUnmounted(() => { if (scrollObserver) scrollObserver.disconnect() })
</script>

<template>
  <AdminPageLayout section="SHOWCASE" accent="purple" variant="rounded" logout-message="Keluar dari Showcase Hub?">

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <!-- HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1
            class="hero-fade-up text-4xl md:text-5xl font-extrabold mb-2 leading-tight break-words whitespace-normal"
            :class="isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-200' : themeClasses.textLightModeFix">
            Kelola Konten Publik
          </h1>
          <p class="hero-fade-up text-lg font-light" style="animation-delay:0.1s" :class="themeClasses.textMuted">
            Atur apa yang dilihat pengunjung di halaman beranda.
          </p>
        </div>
        <button @click="goBackToMenu" :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
          &larr; Kembali
        </button>
      </div>

      <!-- TABS -->
      <div class="scroll-reveal flex gap-3">
        <button v-for="tab in [{ id:'prestasi', label:'🏆 Prestasi' }, { id:'event', label:'📅 Event' }, { id:'kegiatan', label:'📝 Kegiatan' }]"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200', activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive]">
          {{ tab.label }}
        </button>
      </div>

      <!-- MAIN GRID -->
      <div class="scroll-reveal grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- LEFT: FORM -->
        <div class="lg:col-span-1">
          <div :class="['p-5 rounded-2xl border sticky top-24', themeClasses.cardGlass]">
            <h3 :class="['text-base font-bold mb-4 flex items-center gap-2', themeClasses.text]">
              <span :class="['w-2 h-2 rounded-full', isDarkMode ? 'bg-purple-400' : 'bg-purple-600']"></span>
              Tambah {{ activeTab === 'prestasi' ? 'Prestasi' : activeTab === 'event' ? 'Event' : 'Kegiatan' }}
            </h3>

            <div class="space-y-3">
              <div>
                <label :class="['block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70', themeClasses.text]">Judul *</label>
                <input type="text" v-model="formData.title" placeholder="Masukkan judul..."
                  :class="['w-full rounded-xl px-4 py-2.5 outline-none transition-all text-sm', themeClasses.inputBg]">
              </div>

              <div>
                <label :class="['block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70', themeClasses.text]">Deskripsi</label>
                <textarea v-model="formData.description" rows="3" placeholder="Deskripsi singkat..."
                  :class="['w-full rounded-xl px-4 py-2.5 outline-none transition-all text-sm resize-none', themeClasses.inputBg]"></textarea>
              </div>

              <!-- Tanggal — untuk event & kegiatan -->
              <div v-if="activeTab !== 'prestasi'" class="animate-fade-in">
                <label :class="['block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70', themeClasses.text]">Tanggal</label>
                <input type="date" v-model="formData.dateTime"
                  :class="['w-full rounded-xl px-4 py-2.5 outline-none transition-all text-sm', themeClasses.inputBg]">
              </div>

              <!-- Media Picker -->
              <div>
                <label :class="['block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70', themeClasses.text]">Media</label>
                <div class="flex gap-2 mb-2">
                  <button @click="formData.mediaSource = 'upload'"
                    :class="['flex-1 py-2 rounded-lg text-xs font-bold border transition-all',
                      formData.mediaSource === 'upload'
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : (isDarkMode ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-amber-200 text-slate-500 hover:bg-cream-light')]">
                    Upload Baru
                  </button>
                  <button @click="openGallery(); formData.mediaSource = 'gallery'"
                    :class="['flex-1 py-2 rounded-lg text-xs font-bold border transition-all',
                      formData.mediaSource === 'gallery'
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : (isDarkMode ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-amber-200 text-slate-500 hover:bg-cream-light')]">
                    Dari Docs
                  </button>
                </div>
                <div v-if="formData.mediaSource === 'upload'" class="animate-fade-in">
                  <input ref="fileInputRef" type="file" accept="image/*,video/*" @change="onFileChange" class="hidden">
                  <button @click="fileInputRef?.click()"
                    :class="['w-full py-2.5 rounded-xl text-xs font-semibold border-2 border-dashed transition-all',
                      isDarkMode ? 'border-white/10 text-slate-400 hover:border-purple-500/50 hover:text-purple-400' : 'border-amber-200 text-slate-400 hover:border-purple-400']">
                    {{ formData.file ? formData.file.name : '+ Pilih File...' }}
                  </button>
                </div>
                <div v-else-if="formData.documentId" class="animate-fade-in text-xs font-medium px-3 py-2 rounded-xl"
                  :class="isDarkMode ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-700'">
                  ✓ Dokumen #{{ formData.documentId }} dipilih
                  <button @click="formData.documentId = null; formData.mediaSource = 'upload'" class="ml-2 opacity-60 hover:opacity-100">✕</button>
                </div>
              </div>

              <!-- Pin to Front toggle -->
              <div :class="['flex items-center justify-between p-3 rounded-xl border', themeClasses.pinBg]">
                <div>
                  <div :class="['text-sm font-bold', themeClasses.text]">Tampilkan di Beranda</div>
                  <div :class="['text-xs', themeClasses.textMuted]">Pin ke halaman publik</div>
                </div>
                <button @click="formData.isVisible = !formData.isVisible"
                  class="w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none"
                  :class="formData.isVisible ? 'bg-purple-500' : (isDarkMode ? 'bg-slate-600' : 'bg-slate-300')">
                  <div class="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300"
                    :class="formData.isVisible ? 'translate-x-5' : 'translate-x-0'"></div>
                </button>
              </div>

              <button @click="submitForm" :disabled="isSubmitting"
                class="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 text-sm flex items-center justify-center gap-2">
                <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ isSubmitting ? 'Menyimpan...' : 'Simpan Konten' }}
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT: LIST -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex justify-between items-center">
            <h3 :class="['text-lg font-bold', themeClasses.text]">
              Daftar {{ activeTab === 'prestasi' ? 'Prestasi' : activeTab === 'event' ? 'Event' : 'Kegiatan' }}
            </h3>
            <div class="flex items-center gap-2">
              <span :class="['text-xs font-bold px-2.5 py-1 rounded-full border', themeClasses.cardGlass]">
                {{ filteredItems.length }} item
              </span>
              <span v-if="pinnedCount > 0" class="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                📌 {{ pinnedCount }} pinned
              </span>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p :class="['text-sm', themeClasses.textMuted]">Memuat data...</p>
          </div>

          <!-- Empty -->
          <div v-else-if="filteredItems.length === 0"
            :class="['py-12 text-center rounded-2xl border-2 border-dashed', isDarkMode ? 'border-white/10' : 'border-amber-200']">
            <div class="text-4xl mb-3">{{ activeTab === 'prestasi' ? '🏆' : activeTab === 'event' ? '📅' : '📝' }}</div>
            <p :class="['text-sm font-medium', themeClasses.textMuted]">Belum ada {{ activeTab }}. Tambahkan melalui form di samping.</p>
          </div>

          <!-- Items Grid — pakai animate-fade-in bukan scroll-reveal agar muncul saat tab switch -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="item in filteredItems" :key="item.id"
              :class="['rounded-xl overflow-hidden border group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in', themeClasses.cardGlass]">

              <!-- Thumbnail -->
              <div class="h-36 bg-slate-800 relative overflow-hidden cursor-pointer" @click="openItemPreview(item)">
                <template v-if="item.document?.id && (item.document.category?.startsWith('video/') || isVideo(item.document.type))">
                  <video
                    :src="getDocPreviewUrl(item.document.id)"
                    class="w-full h-full object-cover"
                    preload="metadata" muted playsinline
                    @loadedmetadata="(e) => { if (e.target.duration > 0.1) e.target.currentTime = 0.5 }"
                  ></video>
                  <!-- overlay play icon, hanya muncul saat hover -->
                  <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
                    <div class="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/85 flex items-center justify-center shadow-lg transition-all duration-200 scale-75 group-hover:scale-100">
                      <svg class="w-5 h-5 text-slate-800 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </template>
                <img v-else-if="item.document?.id"
                  :src="getDocPreviewUrl(item.document.id)"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy">
                <div v-else class="w-full h-full flex items-center justify-center text-4xl opacity-20">
                  {{ activeTab === 'prestasi' ? '🏆' : activeTab === 'event' ? '📅' : '📝' }}
                </div>

                <!-- Pin badge -->
                <div v-if="item.isVisible"
                  class="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  📌 PINNED
                </div>
                <!-- Category badge -->
                <div class="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white">
                  {{ item.category }}
                </div>
              </div>

              <!-- Content -->
              <div class="p-4">
                <h4 :class="['font-bold text-sm mb-1 truncate', themeClasses.text]">{{ sanitizeText(item.title) }}</h4>
                <p :class="['text-xs line-clamp-2 mb-3', themeClasses.textMuted]">{{ sanitizeText(item.description) || '—' }}</p>

                <div class="flex items-center justify-between">
                  <span v-if="item.dateTime" :class="['text-xs font-medium', themeClasses.textMuted]">
                    📅 {{ formatDate(item.dateTime) }}
                  </span>
                  <span v-else class="text-xs opacity-0">—</span>

                  <div class="flex items-center gap-1.5">
                    <!-- Toggle pin -->
                    <button @click="togglePin(item)" :title="item.isVisible ? 'Sembunyikan dari beranda' : 'Pin ke beranda'"
                      :class="['w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all',
                        item.isVisible
                          ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                          : (isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')]">
                      📌
                    </button>
                    <!-- Hapus -->
                    <button @click="deleteItem(item)" title="Hapus"
                      class="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ITEM PREVIEW MODAL -->
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
              :src="getDocPreviewUrl(selectedItem.document.id)"
              class="rounded-xl shadow-2xl border border-white/10 w-full max-h-[72vh]"
              style="object-fit: contain;"
              controls autoplay
            ></video>
            <img
              v-else-if="selectedItem.document?.id"
              :src="getDocPreviewUrl(selectedItem.document.id)"
              class="rounded-xl shadow-2xl border border-white/10 max-h-[76vh] max-w-full w-auto h-auto"
              style="object-fit: contain;"
              alt="Preview"
            />
            <div class="shrink-0 text-center bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/10">
              <h3 class="text-xl md:text-2xl font-black tracking-tight text-white">{{ sanitizeText(selectedItem.title) }}</h3>
              <p v-if="selectedItem.description" class="text-sm text-blue-200/70 mt-1">{{ sanitizeText(selectedItem.description) }}</p>
              <p v-if="selectedItem.dateTime" class="text-xs text-slate-400 mt-1.5">📅 {{ formatDate(selectedItem.dateTime) }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MEDIA GALLERY MODAL -->
    <Transition name="modal-fade">
      <div v-if="isMediaModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="isMediaModalOpen = false"></div>
        <div :class="['relative w-full max-w-4xl border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col', isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200']">
          <div class="flex justify-between items-center mb-4">
            <h3 :class="['text-xl font-bold', themeClasses.text]">Pilih dari Dokumentasi</h3>
            <button @click="isMediaModalOpen = false"
              class="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div v-if="isLoadingGallery" class="flex-1 flex items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="galleryDocs.length === 0" class="flex-1 flex items-center justify-center py-12">
            <p :class="['text-sm', themeClasses.textMuted]">Belum ada media di Dokumentasi.</p>
          </div>
          <div v-else class="overflow-y-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="doc in galleryDocs" :key="doc.id"
              @click="selectFromGallery(doc)"
              class="aspect-video bg-slate-800 rounded-xl cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all overflow-hidden group relative">
              <img :src="getDocPreviewUrl(doc.id)" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy">
              <div class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-all">
                <p class="text-white text-[10px] font-medium truncate">{{ doc.title }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </AdminPageLayout>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
