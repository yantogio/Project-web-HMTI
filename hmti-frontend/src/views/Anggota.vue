<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'

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

onMounted(() => { fetchMembers() })
</script>

<template>
  <AdminPageLayout section="ANGGOTA" accent="blue" variant="rounded" logout-message="Keluar dari Manajemen Anggota?">

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 :class="['text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r mb-2 leading-tight md:leading-tight break-words whitespace-normal', themeClasses.gradientText]">
            Manajemen Anggota
          </h1>
          <p :class="['text-lg font-light', themeClasses.textMuted]">Pusat data dan informasi seluruh anggota himpunan.</p>
        </div>
        <div class="flex flex-col items-end gap-3">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        :src="member.official_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff&size=80`"
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
        
        <!-- Detail Profile Card Pop-up Modal -->
        <Transition name="fade">
          <div v-if="isProfileOpen && selectedMemberProfile" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeProfilePopup"></div>

            <!-- Modal Content -->
            <Transition name="modal-zoom">
              <div 
                v-if="isProfileOpen" 
                :class="['relative w-full max-w-4xl rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 transform flex flex-col md:flex-row', isDarkMode ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200']"
              >
                <!-- Close Button (Top Right of entire modal) -->
                <button 
                  @click="closeProfilePopup" 
                  class="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-slate-500/15 hover:bg-slate-500/30 p-2 rounded-full transition-all duration-150"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>

                <!-- LEFT SIDE: Profile Photo & Key Info -->
                <div class="w-full md:w-96 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r" :class="isDarkMode ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200/60'">
                  <!-- Avatar -->
                  <div class="w-64 h-64 rounded-2xl p-1 shadow-xl bg-white" :class="isDarkMode ? 'bg-slate-800 border-2 border-slate-700' : 'bg-white border-2 border-slate-200'">
                    <img 
                      :src="selectedMemberProfile.official_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMemberProfile.name)}&background=0D8ABC&color=fff&size=256`" 
                      alt="Profile Avatar" 
                      class="w-full h-full rounded-xl object-cover"
                    />
                  </div>

                  <!-- Name & Title -->
                  <div class="mt-6 text-center">
                    <h3 class="text-xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                      {{ selectedMemberProfile.name }}
                    </h3>
                    <p class="text-xs font-bold uppercase tracking-wider text-blue-500 mt-1.5">
                      {{ selectedMemberProfile.jabatan }}
                    </p>
                    <div class="mt-3 inline-block text-xs font-bold px-3 py-1 rounded-full"
                         :class="selectedMemberProfile.status === 'Aktif' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-slate-500/25 text-slate-500'">
                      {{ selectedMemberProfile.status }}
                    </div>
                  </div>
                </div>

                <!-- RIGHT SIDE: Detailed Metadata -->
                <div class="flex-1 p-8 flex flex-col justify-between">
                  <div>
                    <div class="mb-6">
                      <span class="text-xs font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">Detail Anggota</span>
                    </div>

                    <!-- Details Grid -->
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

                    <!-- Contact Info -->
                    <div class="mt-4 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-2 text-sm">
                      <div class="flex items-center gap-3">
                        <span class="opacity-60 text-base">📧</span>
                        <span class="font-medium truncate" :class="isDarkMode ? 'text-white' : 'text-slate-850'">{{ selectedMemberProfile.email || 'Email belum diatur' }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="opacity-60 text-base">📞</span>
                        <span class="font-medium" :class="isDarkMode ? 'text-white' : 'text-slate-850'">{{ selectedMemberProfile.phone || 'Nomor HP belum diatur' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Bio -->
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

  </AdminPageLayout>
</template>

