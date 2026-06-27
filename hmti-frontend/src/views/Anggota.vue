<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const BASE = 'http://localhost:3000'
// Pola sama seperti getDocPreviewUrl di ShowcaseHub — gunakan identifier (NIA), bukan URL tersimpan
const getAvatarUrl = (nia, avatarUrl) => {
  if (!avatarUrl || !nia) return null
  const qs = avatarUrl.includes('?') ? avatarUrl.slice(avatarUrl.indexOf('?')) : ''
  return `${BASE}/members/${nia}/avatar${qs}`
}

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// --- TEMA (Mode Gelap / Terang - selaras HomeView & LoginView) ---
const isDarkMode = computed(() => themeStore.isDarkMode)
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800',
      text: 'text-white',
      textMuted: 'text-blue-200',
      gradientText: 'from-blue-300 via-white to-blue-200',
      nav: 'bg-white/10 backdrop-blur-md border-white/10 text-white',
      cardGlass: 'bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20',
      cardBorder: 'border-white/10',
      searchBar: 'bg-white/5 border-white/10',
      inputBg: 'bg-white/10 border-white/20 text-white placeholder-blue-300/50 focus:ring-blue-500 focus:bg-white/20',
      selectBg: 'bg-white/10 border-white/20 text-white',
      tableWrap: 'bg-white ring-slate-200/80',
      tableHead: 'bg-slate-50 text-slate-700 border-slate-200',
      tableHeadCell: 'text-slate-600',
      tableBody: 'bg-white text-slate-700',
      tableRowActive: 'bg-blue-100 hover:bg-blue-200',
      tableRowInactive: 'bg-red-50 hover:bg-slate-100',
      tableBorder: 'border-slate-100',
      pagination: 'bg-slate-50 text-slate-600 border-slate-200',
      paginationBtn: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50',
      popupCard: 'bg-white border-gray-100',
      popupText: 'text-gray-900',
      popupMuted: 'text-gray-500',
      modalOverlay: 'bg-slate-950/80',
      modalContent: 'bg-slate-900 border-white/10',
      modalForm: 'bg-slate-800/60',
      modalLabel: 'text-slate-300',
      modalInput: 'bg-slate-700/60 border-slate-500/80 text-white placeholder-slate-400 focus:ring-blue-400 focus:border-blue-400 focus:bg-slate-700',
      modalFooter: 'bg-slate-800/60 border-slate-700',
      modalCancel: 'border-slate-600 text-slate-300 bg-slate-700/60 hover:bg-slate-600',
      btnBack: 'text-blue-200 hover:text-white',
      btnBackMobile: 'bg-white/10 text-white border-white/20',
      restrictedCard: 'bg-white/5 border-white/10 border-dashed',
      restrictedText: 'text-gray-400',
      restrictedMuted: 'text-gray-500',
    }
  } else {
    return {
      bg: 'bg-gradient-to-br from-cream-light via-cream to-cream-dark/30',
      text: 'text-stone-900',
      textMuted: 'text-stone-600',
      gradientText: 'from-primary-blue via-accent-orange to-accent-orange',
      nav: 'bg-cream-light/90 backdrop-blur-md border-amber-200 text-stone-900 shadow-md',
      cardGlass: 'bg-white/95 backdrop-blur-md border-amber-200/70 hover:bg-white shadow-md hover:shadow-xl',
      cardBorder: 'border-amber-200/70',
      searchBar: 'bg-white/90 border-amber-200',
      inputBg: 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:ring-primary-blue focus:bg-white',
      selectBg: 'bg-white border-stone-300 text-stone-900',
      tableWrap: 'bg-white ring-amber-200/60 shadow-xl',
      tableHead: 'bg-cream-light text-stone-700 border-amber-200',
      tableHeadCell: 'text-stone-600',
      tableBody: 'bg-white text-stone-700',
      tableRowActive: 'bg-primary-blue/5 hover:bg-primary-blue/10',
      tableRowInactive: 'bg-red-50/80 hover:bg-stone-50',
      tableBorder: 'border-amber-100',
      pagination: 'bg-cream-light text-stone-600 border-amber-200',
      paginationBtn: 'border-amber-200 text-stone-700 bg-white hover:bg-cream-light',
      popupCard: 'bg-white border-amber-200 shadow-xl',
      popupText: 'text-stone-900',
      popupMuted: 'text-stone-500',
      modalOverlay: 'bg-stone-900/50',
      modalContent: 'bg-white border-amber-200',
      modalForm: 'bg-cream-light',
      modalLabel: 'text-stone-700',
      modalInput: 'bg-white border-stone-300',
      modalFooter: 'bg-cream-light',
      modalCancel: 'border-stone-300 text-stone-700 bg-white hover:bg-cream-light',
      btnBack: 'text-primary-blue hover:text-primary-blue-dark',
      btnBackMobile: 'bg-white text-stone-700 border-amber-200',
      restrictedCard: 'bg-cream-light border-amber-200 border-dashed',
      restrictedText: 'text-stone-500',
      restrictedMuted: 'text-stone-400',
    }
  }
})

// Data
const members = ref([])
const isEditing = ref(false)
const editingNia = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isModalOpen = ref(false)

// Refs untuk input di modal (untuk navigasi keyboard)
const niaRef = ref(null)
const npmRef = ref(null)
const nameRef = ref(null)
const angkatanRef = ref(null)
const jabatanRef = ref(null)
const roleRef = ref(null)
const statusRef = ref(null)
const modalFieldRefs = [niaRef, npmRef, nameRef, angkatanRef, jabatanRef, roleRef, statusRef]

// Data Form (Status sudah ada dari awal)
const newMember = ref({
  nia: '', npm: '', name: '', angkatan: '', jabatan: '', role: '', status: 'Aktif'
})

// Fetch Data
const fetchMembers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/members')
    members.value = response.data
  } catch (error) {
    console.error('Gagal ambil data:', error)
  }
}

// Fungsi Modal
const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  // RESET FORM & KEMBALIKAN STATUS KE DEFAULT
  newMember.value = { nia: '', npm: '', name: '', angkatan: '', jabatan: '', role: '', status: 'Aktif' }
  isEditing.value = false
  editingNia.value = ''
}

// Navigasi antar input di modal dengan Enter / panah atas-bawah
// - Enter / ArrowDown: pindah ke field berikutnya
// - ArrowUp: pindah ke field sebelumnya
// - Enter di field terakhir: langsung panggil saveMember (tambah / update)
const handleKeyDown = (event) => {
  const key = event.key
  if (!['Enter', 'ArrowDown', 'ArrowUp'].includes(key)) return

  const activeElement = event.target
  const elements = modalFieldRefs
    .map(r => r.value)
    .filter(el => el !== null)

  const currentIndex = elements.indexOf(activeElement)
  if (currentIndex === -1) return

  if (key === 'Enter' || key === 'ArrowDown') {
    event.preventDefault()
    const next = elements[currentIndex + 1]
    if (next) {
      next.focus()
    } else if (key === 'Enter') {
      // di field terakhir dan tekan Enter: simpan / update data
      saveMember()
    }
  } else if (key === 'ArrowUp') {
    event.preventDefault()
    const prev = elements[currentIndex - 1]
    if (prev) {
      prev.focus()
    }
  }
}

const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
const { confirm: confirmDialog } = useConfirm()
const isLoading = ref(false)

const saveMember = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    if (!newMember.value.nia || !newMember.value.name || !newMember.value.role) {
      toastWarning('NIA, Nama, dan Role wajib diisi!')
      return
    }
    if (isEditing.value) {
      await axios.patch(`http://localhost:3000/members/${editingNia.value}`, newMember.value)
      toastSuccess('Data anggota berhasil diperbarui!')
    } else {
      await axios.post('http://localhost:3000/members', newMember.value)
      toastSuccess('Anggota baru berhasil ditambahkan!')
    }
    closeModal()
    await fetchMembers()
  } catch (error) {
    console.error('Gagal menyimpan:', error)
    toastError('Terjadi kesalahan saat menyimpan data.')
  } finally {
    isLoading.value = false
  }
}

const editMember = (member) => {
  newMember.value = { ...member }
  isEditing.value = true
  editingNia.value = member.nia
  openModal()
}

const deleteMember = async (nia) => {
  const ok = await confirmDialog('Apakah kamu yakin ingin menghapus anggota ini?')
  if (ok) {
    try {
      await axios.delete(`http://localhost:3000/members/${nia}`)
      toastSuccess('Anggota berhasil dihapus.')
      await fetchMembers()
    } catch (error) {
      console.error('Gagal menghapus:', error)
      toastError('Gagal menghapus data.')
    }
  }
}

// Sorting & Filtering
const rolePriority = { ketum: 1, sekretaris: 2, bendahara: 3, anggota: 4 }
const filteredMembers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  let result = members.value.filter((member) => (
    member.name.toLowerCase().includes(query) ||
    member.npm.includes(query) ||
    member.jabatan.toLowerCase().includes(query) ||
    member.role.toLowerCase().includes(query) ||
    member.nia.toLowerCase().includes(query)
  ))
  result.sort((a, b) => {
    const pA = a.status === 'Aktif' ? 0 : 1
    const pB = b.status === 'Aktif' ? 0 : 1
    if (pA !== pB) return pA - pB
    return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99)
  })
  return result
})
const totalPages = computed(() => Math.ceil(filteredMembers.value.length / itemsPerPage.value))
const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + parseInt(itemsPerPage.value)
  return filteredMembers.value.slice(start, end)
})
const goToPage = (page) => { if (page >= 1 && page <= totalPages.value) currentPage.value = page }

const canManageData = computed(() => {
  if (!authStore.user) return false
  return authStore.user.role !== 'anggota'
})
const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
const goBackToMenu = () => {
  router.push('/admin')
}

// --- STATE IMPORT EXCEL ---
const isImportModalOpen = ref(false)
const importFile = ref(null)
const isImporting = ref(false)
const importResult = ref(null)

const openImportModal = () => {
  importFile.value = null
  importResult.value = null
  isImportModalOpen.value = true
}

const closeImportModal = () => {
  isImportModalOpen.value = false
  importFile.value = null
  importResult.value = null
  isImporting.value = false
}

const handleImportFile = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx') {
    toastWarning('Hanya file .xlsx yang didukung. Download template terlebih dahulu.')
    e.target.value = ''
    return
  }
  importFile.value = file
}

const submitImport = async () => {
  if (isImporting.value || !importFile.value) return
  isImporting.value = true
  try {
    const fd = new FormData()
    fd.append('file', importFile.value)
    const res = await axios.post('http://localhost:3000/members/import', fd, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    importResult.value = res.data
    if (res.data.imported > 0) {
      await fetchMembers()
    }
  } catch (error) {
    console.error('Gagal import:', error)
    toastError('Gagal mengimport: ' + (error.response?.data?.message || error.message))
  } finally {
    isImporting.value = false
  }
}

const downloadTemplate = async () => {
  try {
    const res = await axios.get('http://localhost:3000/members/import-template', {
      headers: { Authorization: `Bearer ${authStore.token}` },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'Template-Import-Anggota.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    toastError('Gagal mendownload template.')
  }
}

// State untuk modal profil (detail lengkap anggota)
const isProfileOpen = ref(false)
const selectedMemberProfile = ref(null)
const hoveredProfileNia = ref(null)

const openProfilePopup = (member) => {
  selectedMemberProfile.value = member
  isProfileOpen.value = true
}

const closeProfilePopup = () => {
  isProfileOpen.value = false
  selectedMemberProfile.value = null
}

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

onMounted(async () => {
  fetchMembers()
  await nextTick()
  setupScrollAnimations()
})

onUnmounted(() => {
  if (scrollObserver) scrollObserver.disconnect()
})

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
  <AdminPageLayout section="ANGGOTA" accent="blue" variant="rounded" logout-message="Keluar dari Manajemen Anggota?">

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="hero-fade-up" :class="['text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r mb-2 leading-tight md:leading-tight break-words whitespace-normal', themeClasses.gradientText]">
            Manajemen Anggota
          </h1>
          <p class="hero-fade-up" style="animation-delay:0.1s" :class="['text-lg font-light', themeClasses.textMuted]">Pusat data dan informasi seluruh anggota himpunan.</p>
        </div>
        <div class="flex flex-col items-end gap-3">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
      </div>
      <div class="scroll-reveal grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="stagger-child" :class="['border p-6 rounded-2xl flex flex-col justify-between items-start transition duration-300', themeClasses.cardGlass, themeClasses.cardBorder]">
          <div>
            <div :class="['text-sm font-bold uppercase tracking-wider mb-1', isDarkMode ? 'text-blue-300' : 'text-blue-600']">Total Anggota</div>
            <div :class="['text-5xl font-extrabold', themeClasses.text]">{{ members.length }}</div>
          </div>
          <div class="bg-blue-500/20 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
              </path>
            </svg>
          </div>
        </div>

        <!-- Card 2: Statistik Aktif -->
        <div class="stagger-child" :class="['border p-6 rounded-2xl flex flex-col justify-between items-start transition duration-300', themeClasses.cardGlass, themeClasses.cardBorder]">
          <div>
            <div class="text-green-500 text-sm font-bold uppercase tracking-wider mb-1">Anggota Aktif</div>
            <div :class="['text-5xl font-extrabold', themeClasses.text]">{{members.filter(m => m.status === 'Aktif').length}}</div>
          </div>
          <div class="bg-green-500/20 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-300" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Card 3: AKSI CEPAT (HANYA MUNCUL KALAU BISA MANAGE DATA) -->
        <div v-if="canManageData" class="stagger-child flex flex-col gap-3">
          <!-- Tombol Tambah Anggota -->
          <div @click="openModal"
            class="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 rounded-2xl flex items-center justify-between cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 group flex-1">
            <div>
              <div class="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Aksi Cepat</div>
              <div class="text-xl font-extrabold text-white leading-tight">Tambah Anggota</div>
            </div>
            <div class="bg-white/20 p-2.5 rounded-full group-hover:bg-white group-hover:text-blue-600 transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
          </div>
          <!-- Tombol Import Excel + Download Template -->
          <div class="flex gap-2">
            <button @click="openImportModal"
              class="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl cursor-pointer transition duration-200 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-bold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Import Excel
            </button>
            <button @click="downloadTemplate"
              class="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl cursor-pointer transition duration-200 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30 text-white font-bold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Template
            </button>
          </div>
        </div>
        <!-- OPSIONAL: PESAN UNTUK ANGGOTA BIASA -->
        <div v-else class="stagger-child" :class="['border p-6 rounded-2xl flex flex-col justify-center items-center border-dashed', themeClasses.restrictedCard]">
          <div :class="['font-bold', themeClasses.restrictedText]">Akses Terbatas</div>
          <div :class="['text-sm mt-1', themeClasses.restrictedMuted]">Hubungi pengurus untuk menambah data.</div>
        </div>
      </div>

      <!-- PENCARIAN -->
      <div class="scroll-reveal" :class="['flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-sm p-4 rounded-xl border', themeClasses.searchBar, themeClasses.cardBorder]">
        <!-- Pencarian (≈70%) -->
        <div class="relative w-full md:w-2/3">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg :class="['h-5 w-5', isDarkMode ? 'text-gray-400' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input v-model="searchQuery" type="text" placeholder="Cari anggota..."
            :class="['w-full border pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none', themeClasses.inputBg]">
        </div>
        <!-- Select jumlah per halaman (≈30%) -->
        <div class="w-full md:w-1/3 md:flex-none">
          <select
            v-model="itemsPerPage"
            :class="['w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer', themeClasses.selectBg]"
          >
            <option value="10" class="text-gray-900">10 / Halaman</option>
            <option value="25" class="text-gray-900">25 / Halaman</option>
            <option value="50" class="text-gray-900">50 / Halaman</option>
            <option value="100" class="text-gray-900">100 / Halaman</option>
          </select>
        </div>
      </div>

      <!-- TABEL DENGAN VISUAL STATUS -->
      <div class="scroll-reveal" :class="['rounded-2xl shadow-2xl overflow-hidden ring-1', themeClasses.tableWrap, isDarkMode ? 'shadow-blue-900/15' : 'shadow-slate-200/50']">
        <div class="overflow-x-auto">
          <table class="min-w-full leading-normal">
            <thead class="sticky top-0 z-10 shadow-md">
              <tr :class="['border-b', themeClasses.tableHead]">
                <!-- HEADER AKSI -->
                <th
                  :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">Aksi
                </th>
                <th :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">NIA</th>
                <th :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">Nama</th>
                <th :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">NPM</th>
                <th :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">Jabatan</th>
                <th :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">Role</th>
                <th :class="['px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider', themeClasses.tableHeadCell]">Angkatan</th>
              </tr>
            </thead>
            <tbody :class="themeClasses.tableBody">
              <tr
                v-for="member in paginatedMembers"
                :key="member.nia"
                :class="[
                  'transition duration-200 ease-in-out border-b last:border-b-0 origin-center',
                  themeClasses.tableBorder,
                  member.status === 'Aktif'
                    ? themeClasses.tableRowActive
                    : themeClasses.tableRowInactive,
                  hoveredProfileNia === member.nia ? 'scale-[1.015] shadow-lg z-10 relative bg-blue-100/30 backdrop-blur-sm' : ''
                ]"
              >

                <!-- KOLOM AKSI -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <!-- Tombol Profil (Menampilkan Foto Anggota) -->
                    <button
                      @click="openProfilePopup(member)"
                      @mouseenter="hoveredProfileNia = member.nia"
                      @mouseleave="hoveredProfileNia = null"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-blue-200 shadow-sm overflow-hidden hover:border-blue-500 hover:scale-110 active:scale-95 transition-all duration-200 bg-white"
                      aria-label="Lihat profil"
                      title="Lihat profil"
                    >
                      <img
                        :src="getAvatarUrl(member.nia, member.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff&size=80`"
                        alt="Avatar"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    <!-- Tombol Edit (lebih tegas, biru sesuai tema) - Hanya jika bisa manage -->
                    <button
                      v-if="canManageData"
                      @click="editMember(member)"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-150"
                      aria-label="Edit anggota"
                      title="Edit anggota"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536M4 20h4.5L19 9.5l-4.5-4.5L4 15.5V20z"
                        />
                      </svg>
                    </button>
                    <!-- Tombol Hapus (lebih tegas, merah kontras) - Hanya jika bisa manage -->
                    <button
                      v-if="canManageData"
                      @click="deleteMember(member.nia)"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors duration-150"
                      aria-label="Hapus anggota"
                      title="Hapus anggota"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 7h12M10 11v6m4-6v6M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-6 py-5 font-medium text-sm text-slate-800">{{ member.nia }}</td>
                <td class="px-6 py-5 font-semibold text-sm text-slate-900">{{ member.name }}</td>
                <td class="px-6 py-5 text-sm text-slate-700">{{ member.npm }}</td>
                <td class="px-6 py-5 text-sm">
                  <span
                    :class="member.status === 'Aktif'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-slate-200 text-slate-700'"
                    class="py-1 px-3 rounded-full text-xs font-semibold">
                    {{ member.jabatan }}
                  </span>
                </td>
                <td class="px-6 py-5 text-sm capitalize font-medium text-slate-800">{{ member.role }}</td>
                <td class="px-6 py-5 text-sm text-slate-700">{{ member.angkatan }}</td>
              </tr>

              <!-- COLOSPAN DINAMIS: SEKARANG SELALU 7 KOLOM -->
              <tr v-if="paginatedMembers.length === 0">
                <td :colspan="7"
                  class="px-6 py-10 text-center text-slate-500 font-medium">
                  Belum ada data anggota.
                </td>
              </tr>
            </tbody>
          </table>
        </div> <!-- Tutup tag tabel -->
        
        <!-- Pagination -->
        <div :class="['px-6 py-4 flex flex-col md:flex-row justify-between items-center text-sm border-t', themeClasses.pagination]">
          <div class="mb-2 md:mb-0">
            Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredMembers.length) }}
            dari {{ filteredMembers.length }} data
          </div>
          <div class="flex gap-2">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
              :class="['px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition', themeClasses.paginationBtn]">
              Prev
            </button>
            <span class="px-4 py-2 font-semibold text-slate-600">
              Hal {{ currentPage }} dari {{ totalPages }}
            </span>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
              :class="['px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition', themeClasses.paginationBtn]">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL IMPORT EXCEL -->
    <Transition name="modal-overlay-fade">
      <div v-if="isImportModalOpen" class="fixed inset-0 z-50" role="dialog" aria-modal="true">
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <div :class="['absolute inset-0 backdrop-blur-sm', isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/50']" @click="closeImportModal"></div>

          <div :class="['relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border', themeClasses.modalContent]">

            <!-- Header -->
            <div class="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 overflow-hidden">
              <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div class="relative flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-white">Import Anggota dari Excel</h3>
                    <p class="text-xs text-emerald-100/80 mt-0.5">Upload file .xlsx sesuai template yang disediakan.</p>
                  </div>
                </div>
                <button type="button" @click="closeImportModal"
                  class="bg-white/10 hover:bg-white/25 rounded-xl p-2 text-emerald-100 hover:text-white transition-all">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div :class="['px-6 py-6', themeClasses.modalForm]">

              <!-- LANGKAH 1: Pilih file (saat belum ada hasil) -->
              <div v-if="importResult === null">
                <p :class="['text-sm mb-5', themeClasses.textMuted]">
                  Pastikan file sudah sesuai dengan template. Belum punya template?
                  <button @click="downloadTemplate" class="text-emerald-500 hover:underline font-semibold">Download di sini.</button>
                </p>

                <!-- Area upload file -->
                <label :class="['flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                  importFile ? (isDarkMode ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500 bg-emerald-50') : (isDarkMode ? 'border-white/20 hover:border-white/40 bg-white/5' : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30')]">
                  <div class="flex flex-col items-center gap-2 pointer-events-none">
                    <svg v-if="!importFile" class="w-10 h-10 opacity-40" :class="themeClasses.textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <svg v-else class="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span v-if="!importFile" :class="['text-sm font-semibold', themeClasses.textMuted]">Klik untuk pilih file .xlsx</span>
                    <span v-else class="text-sm font-bold text-emerald-500 max-w-xs truncate px-2">{{ importFile.name }}</span>
                    <span v-if="importFile" :class="['text-xs', themeClasses.textMuted]">Klik untuk ganti file</span>
                  </div>
                  <input type="file" accept=".xlsx" class="hidden" @change="handleImportFile">
                </label>

                <div :class="['mt-5 flex justify-end gap-3 pt-4 border-t', isDarkMode ? 'border-white/10' : 'border-slate-200']">
                  <button @click="closeImportModal" :class="['px-5 py-2.5 rounded-xl font-semibold text-sm border transition', themeClasses.modalCancel]">
                    Batal
                  </button>
                  <button @click="submitImport" :disabled="!importFile || isImporting"
                    class="px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <svg v-if="isImporting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {{ isImporting ? 'Memproses...' : 'Proses Import' }}
                  </button>
                </div>
              </div>

              <!-- LANGKAH 2: Hasil import -->
              <div v-else>
                <div class="space-y-3 mb-5">
                  <!-- Berhasil -->
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <svg class="h-6 w-6 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-bold text-emerald-400">{{ importResult.imported }} anggota berhasil ditambahkan</span>
                  </div>
                  <!-- Dilewati/Error -->
                  <div v-if="importResult.skipped > 0" class="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <svg class="h-6 w-6 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    <span class="font-bold text-amber-400">{{ importResult.skipped }} baris dilewati</span>
                  </div>
                </div>

                <!-- Daftar error per baris -->
                <div v-if="importResult.errors && importResult.errors.length > 0" :class="['rounded-xl border p-3 max-h-48 overflow-y-auto space-y-1.5', isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50']">
                  <p :class="['text-xs font-bold uppercase tracking-wider mb-2', themeClasses.textMuted]">Detail Error</p>
                  <div v-for="err in importResult.errors" :key="err.row" class="flex items-start gap-2">
                    <span class="text-rose-400 font-bold text-xs flex-shrink-0 mt-0.5">Baris {{ err.row }}:</span>
                    <span :class="['text-xs', themeClasses.textMuted]">{{ err.reason }}</span>
                  </div>
                </div>

                <div :class="['mt-5 flex justify-end pt-4 border-t', isDarkMode ? 'border-white/10' : 'border-slate-200']">
                  <button @click="closeImportModal"
                    class="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow transition">
                    Tutup
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL POP-UP -->
    <Transition name="modal-overlay-fade">
      <div v-if="isModalOpen" class="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <div :class="['absolute inset-0 backdrop-blur-sm', isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/50']" @click="closeModal"></div>

          <Transition name="modal-card-pop">
            <div
              v-if="isModalOpen"
              :class="['relative w-full max-w-2xl rounded-2xl text-left overflow-hidden shadow-2xl border', themeClasses.modalContent]"
            >
              <!-- Header gradient -->
              <div class="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-5 overflow-hidden">
                <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <div class="absolute -bottom-4 left-10 w-16 h-16 bg-white/5 rounded-full blur-lg pointer-events-none"></div>
                <div class="relative flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                      <svg v-if="isEditing" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M4 20h4.5L19 9.5l-4.5-4.5L4 15.5V20z"/>
                      </svg>
                      <svg v-else class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-white" id="modal-title">
                        {{ isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru' }}
                      </h3>
                      <p class="text-xs text-blue-100/80 mt-0.5">{{ isEditing ? 'Perbarui informasi keanggotaan.' : 'Isi formulir untuk mendaftarkan anggota baru.' }}</p>
                    </div>
                  </div>
                  <button type="button" @click="closeModal"
                    class="bg-white/10 hover:bg-white/25 rounded-xl p-2 text-blue-100 hover:text-white focus:outline-none transition-all duration-150">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Form body -->
              <div :class="['px-6 py-6', themeClasses.modalForm]">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
                        NIA
                      </span>
                    </label>
                    <input v-model="newMember.nia" ref="niaRef" type="text" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200', themeClasses.modalInput]"
                      placeholder="HMTI-003">
                  </div>
                  <div>
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                        NPM
                      </span>
                    </label>
                    <input v-model="newMember.npm" ref="npmRef" type="text" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200', themeClasses.modalInput]"
                      placeholder="2301111222">
                  </div>
                  <div class="md:col-span-2">
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        Nama Lengkap
                      </span>
                    </label>
                    <input v-model="newMember.name" ref="nameRef" type="text" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200', themeClasses.modalInput]"
                      placeholder="Nama Mahasiswa">
                  </div>
                  <div>
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        Angkatan
                      </span>
                    </label>
                    <input v-model="newMember.angkatan" ref="angkatanRef" type="text" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200', themeClasses.modalInput]"
                      placeholder="2023-2024">
                  </div>
                  <div>
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        Jabatan
                      </span>
                    </label>
                    <input v-model="newMember.jabatan" ref="jabatanRef" type="text" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200', themeClasses.modalInput]"
                      placeholder="Staff / Kadiv">
                  </div>
                  <div>
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        Role / Hak Akses
                      </span>
                    </label>
                    <select v-model="newMember.role" ref="roleRef" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200 cursor-pointer', themeClasses.modalInput]">
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" disabled value="">Pilih Role...</option>
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="ketum">Ketua Umum</option>
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="sekretaris">Sekretaris</option>
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="bendahara">Bendahara</option>
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="anggota">Anggota</option>
                    </select>
                  </div>
                  <div>
                    <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.modalLabel]">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Status Keanggotaan
                      </span>
                    </label>
                    <select v-model="newMember.status" ref="statusRef" @keydown="handleKeyDown"
                      :class="['modal-input w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all duration-200 cursor-pointer', themeClasses.modalInput]">
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="Aktif">Aktif</option>
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="Tidak Aktif">Tidak Aktif</option>
                      <option :class="isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'" value="Alumni">Alumni</option>
                    </select>
                  </div>
                </div>
                <p :class="['mt-5 text-xs flex items-center gap-1.5', isDarkMode ? 'text-slate-500' : 'text-slate-400']">
                  <kbd :class="['px-1.5 py-0.5 rounded text-[10px] font-mono border', isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600']">Enter</kbd>
                  atau
                  <kbd :class="['px-1.5 py-0.5 rounded text-[10px] font-mono border', isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600']">↓</kbd>
                  untuk pindah field berikutnya
                </p>
              </div>

              <!-- Footer -->
              <div :class="['px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t', themeClasses.modalFooter]">
                <button type="button" @click="closeModal"
                  :class="['inline-flex justify-center items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium focus:outline-none transition-all duration-150', themeClasses.modalCancel]">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  Batal
                </button>
                <button type="button" @click="saveMember" :disabled="isLoading"
                  class="inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-lg px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none transition-all duration-150 active:scale-95">
                  <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <svg v-else-if="isEditing" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  <span v-if="isLoading">Menyimpan...</span>
                  <span v-else>{{ isEditing ? 'Update Data' : 'Simpan Anggota' }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

  </AdminPageLayout>

  <!-- PROFILE POPUP — Teleport agar tidak terpengaruh transform parent -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isProfileOpen && selectedMemberProfile" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeProfilePopup"></div>

        <Transition name="modal-zoom">
          <div
            v-if="isProfileOpen"
            :class="['relative w-full max-w-4xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col md:flex-row', isDarkMode ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200']"
            style="max-height: 90vh"
          >
            <button
              @click="closeProfilePopup"
              class="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 bg-slate-500/15 hover:bg-slate-500/30 p-2 rounded-full transition-all duration-150"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <!-- LEFT: Photo & Key Info -->
            <div class="w-full md:w-80 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r" :class="isDarkMode ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200/60'">
              <div class="w-56 h-56 rounded-2xl shadow-xl overflow-hidden" :class="isDarkMode ? 'border-2 border-slate-700' : 'border-2 border-slate-200'">
                <img
                  :src="getAvatarUrl(selectedMemberProfile.nia, selectedMemberProfile.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMemberProfile.name)}&background=0D8ABC&color=fff&size=256`"
                  alt="Profile Avatar"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="mt-6 text-center">
                <h3 class="text-xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-900'">{{ selectedMemberProfile.name }}</h3>
                <p class="text-xs font-bold uppercase tracking-wider text-blue-500 mt-1.5">{{ selectedMemberProfile.jabatan }}</p>
                <div class="mt-3 inline-block text-xs font-bold px-3 py-1 rounded-full"
                     :class="selectedMemberProfile.status === 'Aktif' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-slate-500/25 text-slate-400'">
                  {{ selectedMemberProfile.status }}
                </div>
              </div>
            </div>

            <!-- RIGHT: Detailed Metadata -->
            <div class="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div class="mb-6">
                  <span class="text-xs font-black uppercase tracking-widest text-blue-500">Detail Anggota</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">NIA</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedMemberProfile.nia }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">NPM</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedMemberProfile.npm || '-' }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">Hak Akses (Role)</div>
                    <div class="font-semibold mt-0.5 capitalize" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedMemberProfile.role }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">Angkatan</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedMemberProfile.angkatan }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10 col-span-2">
                    <div class="text-[10px] font-bold uppercase tracking-wider opacity-50">Tanggal Bergabung</div>
                    <div class="font-semibold mt-0.5" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                      {{ new Date(selectedMemberProfile.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                    </div>
                  </div>
                </div>
                <div class="mt-4 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-2 text-sm">
                  <div class="flex items-center gap-3">
                    <span class="opacity-60">📧</span>
                    <span class="font-medium truncate" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedMemberProfile.email || 'Email belum diatur' }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="opacity-60">📞</span>
                    <span class="font-medium" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ selectedMemberProfile.phone || 'Nomor HP belum diatur' }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-6 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 text-sm">
                <div class="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Bio Singkat</div>
                <p class="italic leading-relaxed text-xs" :class="isDarkMode ? 'text-slate-300/80' : 'text-slate-500'">
                  "{{ selectedMemberProfile.bio || 'Anggota ini belum menulis bio singkat.' }}"
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay-fade-enter-active,
.modal-overlay-fade-leave-active { transition: opacity 0.2s ease; }
.modal-overlay-fade-enter-from,
.modal-overlay-fade-leave-to { opacity: 0; }

.modal-card-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-card-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease-in;
}
.modal-card-pop-enter-from { opacity: 0; transform: scale(0.92) translateY(16px); }
.modal-card-pop-leave-to { opacity: 0; transform: scale(0.96) translateY(8px); }

.modal-input:focus { box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
</style>

