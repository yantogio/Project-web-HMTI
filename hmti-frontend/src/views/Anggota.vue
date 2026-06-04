<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

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
      modalOverlay: 'bg-gray-900/75',
      modalContent: 'bg-white border-white/20',
      modalForm: 'bg-gray-50',
      modalLabel: 'text-gray-700',
      modalInput: 'bg-white border-gray-300',
      modalFooter: 'bg-gray-50',
      modalCancel: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
      btnBack: 'text-blue-200 hover:text-white',
      btnBackMobile: 'bg-white/10 text-white border-white/20',
      restrictedCard: 'bg-white/5 border-white/10 border-dashed',
      restrictedText: 'text-gray-400',
      restrictedMuted: 'text-gray-500',
    }
  } else {
    return {
      bg: 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200',
      text: 'text-slate-900',
      textMuted: 'text-slate-600',
      gradientText: 'from-blue-600 via-indigo-600 to-blue-800',
      nav: 'bg-white/80 backdrop-blur-md border-slate-200 text-slate-900 shadow-lg',
      cardGlass: 'bg-white/90 backdrop-blur-md border-slate-200/60 hover:bg-white shadow-xl',
      cardBorder: 'border-slate-200',
      searchBar: 'bg-white/80 border-slate-200',
      inputBg: 'bg-white/80 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:bg-white',
      selectBg: 'bg-white/80 border-slate-300 text-slate-900',
      tableWrap: 'bg-white ring-slate-200 shadow-xl',
      tableHead: 'bg-slate-50 text-slate-700 border-slate-200',
      tableHeadCell: 'text-slate-600',
      tableBody: 'bg-white text-slate-700',
      tableRowActive: 'bg-blue-50 hover:bg-blue-100',
      tableRowInactive: 'bg-red-50/80 hover:bg-slate-50',
      tableBorder: 'border-slate-100',
      pagination: 'bg-slate-50 text-slate-600 border-slate-200',
      paginationBtn: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50',
      popupCard: 'bg-white border-slate-200 shadow-xl',
      popupText: 'text-slate-900',
      popupMuted: 'text-slate-500',
      modalOverlay: 'bg-slate-900/50',
      modalContent: 'bg-white border-slate-200',
      modalForm: 'bg-slate-50',
      modalLabel: 'text-gray-700',
      modalInput: 'bg-white border-gray-300',
      modalFooter: 'bg-gray-50',
      modalCancel: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
      btnBack: 'text-blue-600 hover:text-blue-800',
      btnBackMobile: 'bg-white/90 text-slate-700 border-slate-300',
      restrictedCard: 'bg-slate-50 border-slate-200 border-dashed',
      restrictedText: 'text-slate-500',
      restrictedMuted: 'text-slate-400',
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

const isLoading = ref(false)

const saveMember = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    if (!newMember.value.nia || !newMember.value.name || !newMember.value.role) {
      alert('ERROR! NIA, Nama, dan Role wajib diisi!');
      return;
    }
    if (isEditing.value) {
      await axios.patch(`http://localhost:3000/members/${editingNia.value}`, newMember.value)
      alert('Data anggota berhasil diperbarui!')
    } else {
      await axios.post('http://localhost:3000/members', newMember.value)
      alert('Anggota baru berhasil ditambahkan!')
    }
    closeModal()
    await fetchMembers()
  } catch (error) {
    console.error('Gagal menyimpan:', error)
    alert('Terjadi kesalahan saat menyimpan data.')
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
  if (confirm('Apakah kamu yakin ingin menghapus anggota ini?')) {
    try {
      await axios.delete(`http://localhost:3000/members/${nia}`)
      alert('Anggota berhasil dihapus.')
      await fetchMembers()
    } catch (error) {
      console.error('Gagal menghapus:', error)
      alert('Gagal menghapus data.')
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

// Store & Router
const authStore = useAuthStore()
const router = useRouter()
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

// Data Member yang sedang di-hover (untuk floating card)
const activeMember = ref(null)
const showPopup = ref(false)
const popupPosition = ref({ x: 0, y: 0 })

// Saat kursor masuk ke baris: langsung tampilkan popup di dekat posisi mouse
const startTimer = (member, event) => {
  activeMember.value = member
  updatePopupPosition(event)
  showPopup.value = true
}

// Update posisi popup saat mouse bergerak di dalam baris
const updatePopupPosition = (event) => {
  if (!showPopup.value && !activeMember.value) return

  const { clientX, clientY } = event
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  // Perkiraan ukuran card (harus selaras dengan kelas w-80 & konten square image)
  const cardWidth = 320 // px, w-80
  const cardHeight = 320 + 96 // px (square image + teks & padding, kira-kira)
  const margin = 20

  let nextX = clientX + margin
  let nextY = clientY + margin

  // Jangan melewati sisi kanan layar
  if (nextX + cardWidth > viewportWidth - margin) {
    nextX = viewportWidth - cardWidth - margin
  }

  // Jangan melewati sisi bawah layar
  if (nextY + cardHeight > viewportHeight - margin) {
    nextY = viewportHeight - cardHeight - margin
  }

  // Hindari update yang terlalu sering (hanya jika berubah cukup besar)
  if (
    Math.abs(nextX - popupPosition.value.x) < 4 &&
    Math.abs(nextY - popupPosition.value.y) < 4
  ) {
    return
  }

  popupPosition.value = { x: nextX, y: nextY }
}

// Saat kursor keluar dari baris: sembunyikan popup
const stopTimer = () => {
  showPopup.value = false
  activeMember.value = null
}

onMounted(() => { fetchMembers() })
</script>

<template>
  <!-- BACKGROUND -->
  <div :class="['min-h-screen p-4 md:p-8 relative overflow-hidden transition-colors duration-500', themeClasses.bg]">
    <div :class="[
      'absolute top-0 left-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob transition-colors duration-500',
      isDarkMode ? 'bg-blue-500' : 'bg-blue-400'
    ]"></div>
    <div :class="[
      'absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 transition-colors duration-500',
      isDarkMode ? 'bg-indigo-500' : 'bg-indigo-400'
    ]"></div>

    <!-- NAVBAR -->
    <nav :class="['border-b sticky top-0 z-40 shadow-2xl rounded-2xl mb-8 transition-all duration-300', themeClasses.nav, isDarkMode ? 'border-white/10' : 'border-slate-200']">
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
            <div :class="['font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r', isDarkMode ? 'from-blue-200 to-white' : 'from-blue-600 to-slate-900']">
              HMTI <span :class="['font-light', isDarkMode ? 'text-blue-200' : 'text-blue-600']">ADMIN</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <!-- Theme Toggle -->
            <button @click="themeStore.toggleTheme()" :class="[
              'p-2 rounded-full transition-all duration-300 hover:scale-110',
              isDarkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            ]" title="Ganti Tema">
              <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <div class="hidden md:block text-right">
              <div :class="['text-sm font-bold', themeClasses.text]">{{ authStore.user ? authStore.user.name : 'User' }}</div>
              <div :class="['text-xs capitalize', themeClasses.textMuted]">{{ authStore.user ? authStore.user.role : 'Guest' }}</div>
            </div>
            <button @click="handleLogout"
              class="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">KELUAR</button>
          </div>
        </div>
      </div>
    </nav>

    <div class="relative z-10 max-w-7xl mx-auto space-y-8">

      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 :class="['text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r mb-2 leading-tight md:leading-tight break-words whitespace-normal', themeClasses.gradientText]">
            Manajemen Anggota
          </h1>
          <p :class="['text-lg font-light', themeClasses.textMuted]">Pusat data dan informasi seluruh anggota himpunan.</p>
        </div>
        <button @click="goBackToMenu"
          :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
          &larr; Kembali ke Menu
        </button>
      </div>

      <!-- BAGIAN CTA (STATISTIK + TOMBOL) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Card 1: Statistik -->
        <div :class="['border p-6 rounded-2xl flex flex-col justify-between items-start transition duration-300', themeClasses.cardGlass, themeClasses.cardBorder]">
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
        <div :class="['border p-6 rounded-2xl flex flex-col justify-between items-start transition duration-300', themeClasses.cardGlass, themeClasses.cardBorder]">
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

        <!-- Card 3: TOMBOL TAMBAH (HANYA MUNCUL KALAU BISA MANAGE DATA) -->
        <div v-if="canManageData" @click="openModal"
          class="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl flex flex-col justify-between items-start cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 group">
          <div class="flex justify-between w-full">
            <div>
              <div class="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Aksi Cepat</div>
              <div class="text-2xl font-extrabold text-white leading-tight mb-2">Tambah Anggota</div>
              <div class="text-blue-100 text-sm opacity-90">Daftarkan anggota baru.</div>
            </div>
            <div class="bg-white/20 p-3 rounded-full group-hover:bg-white group-hover:text-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
          </div>
        </div>
        <!-- OPSIONAL: PESAN UNTUK ANGGOTA BIASA -->
        <div v-else :class="['border p-6 rounded-2xl flex flex-col justify-center items-center border-dashed', themeClasses.restrictedCard]">
          <div :class="['font-bold', themeClasses.restrictedText]">Akses Terbatas</div>
          <div :class="['text-sm mt-1', themeClasses.restrictedMuted]">Hubungi pengurus untuk menambah data.</div>
        </div>
      </div>

      <!-- PENCARIAN -->
      <div :class="['flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-sm p-4 rounded-xl border', themeClasses.searchBar, themeClasses.cardBorder]">
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
      <div :class="['rounded-2xl shadow-2xl overflow-hidden ring-1', themeClasses.tableWrap, isDarkMode ? 'shadow-blue-900/15' : 'shadow-slate-200/50']">
        <div class="overflow-x-auto">
          <table class="min-w-full leading-normal">
            <thead class="sticky top-0 z-10 shadow-md">
              <tr :class="['border-b', themeClasses.tableHead]">
                <!-- HEADER AKSI: SAMA DIHIDUPKAN JIKA TIDAK BISA MANAGE -->
                <th v-if="canManageData"
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
                  'transition duration-150 ease-in-out border-b last:border-b-0',
                  themeClasses.tableBorder,
                  member.status === 'Aktif'
                    ? themeClasses.tableRowActive
                    : themeClasses.tableRowInactive
                ]"
                @mouseenter="startTimer(member, $event)"
                @mousemove="updatePopupPosition($event)"
                @mouseleave="stopTimer"
              >

                <!-- KOLOM AKSI -->
                <td v-if="canManageData" class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <!-- Tombol Edit (lebih tegas, biru sesuai tema) -->
                    <button
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
                    <!-- Tombol Hapus (lebih tegas, merah kontras) -->
                    <button
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

              <!-- COLOSPAN DINAMIS: HITUNG JUMLAH KOLOM (AKSI = 1, LAINNYA = 6) -->
              <tr v-if="paginatedMembers.length === 0">
                <td :colspan="canManageData ? 7 : 6"
                  class="px-6 py-10 text-center text-slate-500 font-medium">
                  Belum ada data anggota.
                </td>
              </tr>
            </tbody>
          </table>
        </div> <!-- Tutup tag tabel -->
        
        <!-- Floating card yang mengikuti posisi kursor -->
        <div
          v-if="showPopup && activeMember"
          class="fixed z-50 pointer-events-none"
          :style="{ top: popupPosition.y + 'px', left: popupPosition.x + 'px' }"
        >
          <div :class="['w-80 rounded-2xl shadow-2xl border overflow-hidden transform transition-all duration-200', themeClasses.popupCard]">
            <!-- Foto 1:1 (square) -->
            <div class="w-full bg-gray-200">
              <div class="w-full aspect-square">
                <img
                  :src="activeMember.official_photo_url || 'https://via.placeholder.com/400'"
                  alt="Foto anggota"
                  class="w-full h-full object-cover"
                >
              </div>
            </div>
            <!-- Detail anggota -->
            <div class="p-4 space-y-1">
              <div :class="['text-sm font-bold truncate', themeClasses.popupText]">
                {{ activeMember.name }}
              </div>
              <div :class="['text-xs', themeClasses.popupMuted]">
                NIA: {{ activeMember.nia }} • NPM: {{ activeMember.npm }}
              </div>
              <div :class="['text-xs', themeClasses.popupMuted]">
                {{ activeMember.jabatan }} • {{ activeMember.angkatan }}
              </div>
              <div class="text-xs font-semibold mt-1"
                   :class="activeMember.status === 'Aktif' ? 'text-emerald-600' : 'text-rose-600'">
                Status: {{ activeMember.status }}
              </div>
            </div>
          </div>
        </div>

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

    <!-- MODAL POP-UP (SAMA SEPERTI SEBELUMNYA, TAPI DITAMBAH DROPDOWN STATUS) -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog"
      aria-modal="true">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div :class="['fixed inset-0 backdrop-blur-sm transition-opacity', isDarkMode ? 'bg-gray-900/75' : 'bg-slate-900/50']" @click="closeModal"></div>
        <div
          :class="['inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-2xl border', themeClasses.modalContent]">
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-5 sm:px-6 sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 class="text-xl leading-6 font-bold text-white" id="modal-title">
                {{ isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru' }}
              </h3>
              <p class="mt-1 text-sm text-blue-100">{{ isEditing ? 'Perbarui data keanggotaan.' : 'Isi formulir di bawah.' }}</p>
            </div>
            <button type="button" @click="closeModal"
              class="bg-transparent rounded-md p-2 text-blue-100 hover:text-white focus:outline-none sm:absolute sm:top-4 sm:right-4">
              <span class="sr-only">Tutup</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div :class="['px-4 py-5 sm:p-6', themeClasses.modalForm]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">NIA</label>
                <input
                  v-model="newMember.nia"
                  ref="niaRef"
                  type="text"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                  placeholder="HMTI-003"
                >
              </div>
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">NPM</label>
                <input
                  v-model="newMember.npm"
                  ref="npmRef"
                  type="text"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                  placeholder="2301111222"
                >
              </div>
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">Nama Lengkap</label>
                <input
                  v-model="newMember.name"
                  ref="nameRef"
                  type="text"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                  placeholder="Nama Mahasiswa"
                >
              </div>
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">Angkatan</label>
                <input
                  v-model="newMember.angkatan"
                  ref="angkatanRef"
                  type="text"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                  placeholder="2023-2024"
                >
              </div>
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">Jabatan</label>
                <input
                  v-model="newMember.jabatan"
                  ref="jabatanRef"
                  type="text"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                  placeholder="Staff / Kadiv"
                >
              </div>
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">Role</label>
                <select
                  v-model="newMember.role"
                  ref="roleRef"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                >
                  <option disabled value="">Pilih Role...</option>
                  <option value="ketum">Ketua Umum</option>
                  <option value="sekretaris">Sekretaris</option>
                  <option value="bendahara">Bendahara</option>
                  <option value="anggota">Anggota</option>
                </select>
              </div>
              <!-- TAMBAHAN: INPUT STATUS -->
              <div>
                <label :class="['block text-sm font-medium mb-1', themeClasses.modalLabel]">Status Keanggotaan</label>
                <select
                  v-model="newMember.status"
                  ref="statusRef"
                  @keydown="handleKeyDown"
                  :class="['modal-input w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', themeClasses.modalInput]"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
            </div>
          </div>
          <div :class="['px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:px-6', themeClasses.modalFooter]">
            <button
              type="button"
              @click="saveMember"
              :disabled="isLoading"
              class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              <span v-if="isLoading">Menyimpan...</span>
              <span v-else>
                {{ isEditing ? 'Update Data' : 'Simpan Anggota' }}
              </span>
            </button>
            <button type="button" @click="closeModal"
              :class="['mt-3 w-full inline-flex justify-center rounded-lg border shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm', themeClasses.modalCancel]">
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
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
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
</style>