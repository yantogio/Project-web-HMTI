<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import axios from 'axios' // Tambah import axios

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// --- TAMBAHKAN FUNGSI INI ---
const goBackToMenu = () => {
  router.push('/admin')
}

// --- 1. LOGIKA TEMA (Sama persis seperti sebelumnya) ---
const isDarkMode = computed(() => themeStore.isDarkMode)

const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      textMuted: 'text-blue-200/60',
      cardGlass: 'bg-slate-800/40 border border-white/10 hover:border-white/20 backdrop-blur-md',
      cardContent: 'bg-slate-800/60 border border-white/5',
      inputBg: 'bg-white/5 border border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500 focus:bg-white/10 rounded-xl',
      incomeColor: 'text-emerald-400',
      expenseColor: 'text-rose-400',
      timelineLine: 'border-l-white/10',
      navGlass: 'bg-white/10 backdrop-blur-md border-b border-white/10',
      btnBack: 'text-blue-200 hover:text-white',
      btnBackMobile: 'bg-white/10 text-white border-white/20 hover:bg-white/20'
    }
  } else {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      cardGlass: 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg shadow-sm backdrop-blur-sm',
      cardContent: 'bg-white border border-slate-100 shadow-sm',
      inputBg: 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl',
      incomeColor: 'text-emerald-600',
      expenseColor: 'text-rose-600',
      timelineLine: 'border-l-slate-200',
      navGlass: 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm',
      btnBack: 'text-blue-600 hover:text-blue-800',
      btnBackMobile: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
    }
  }
})

// --- 2. DATA TRANSAKSI (KOSONG DI AWAL, DIISI API) ---
const transactions = ref([])
const duesList = ref([])      // Data Daftar Tagihan (Untuk di bawah Timeline)
const duesSummaryList = ref([])
const financeConfig = ref(null) // Data Konfigurasi (Nominal, Denda)
// Form edit konfigurasi (duesAmount, lateFee, dueDay, finalDay)
const configForm = ref({
  duesAmount: 0,
  lateFee: 0,
  dueDay: 10,
  finalDay: 15
})
const isSavingConfig = ref(false)
const memberStatus = ref(null) // Data Status Tagihan (Untuk Notifikasi Dropdown)
// State untuk Notifikasi Instant (Warna Merah di Dropdown)
const paymentWarning = ref({ show: false, message: '', amount: 0 })

// --- 2.1 FUNGSI AMBIL KONFIGURASI (Agar nominal terbaca) ---
const fetchConfig = async () => {
  try {
    const res = await axios.get('http://localhost:3000/finance/config', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const data = res.data
    financeConfig.value = data
    // Sync ke form edit (dukung camelCase / snake_case dari backend)
    configForm.value = {
      duesAmount: data?.duesAmount ?? data?.dues_amount ?? 0,
      lateFee: data?.lateFee ?? data?.late_fee ?? 0,
      dueDay: data?.dueDay ?? data?.due_day ?? 10,
      finalDay: data?.finalDay ?? data?.final_day ?? 15
    }
  } catch (e) {
    console.error(e)
  }
}

// --- 2.1b UPDATE KONFIGURASI (POST /finance/config) ---
const saveConfig = async () => {
  const { duesAmount, lateFee, dueDay, finalDay } = configForm.value
  if (dueDay < 1 || dueDay > 31 || finalDay < 1 || finalDay > 31) {
    alert('Tanggal tenggat dan tanggal akhir harus antara 1–31.')
    return
  }
  isSavingConfig.value = true
  try {
    await axios.post('http://localhost:3000/finance/config', {
      duesAmount: Number(duesAmount) || 0,
      lateFee: Number(lateFee) || 0,
      dueDay: Number(dueDay) || 10,
      finalDay: Number(finalDay) || 15
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    alert('Konfigurasi iuran berhasil disimpan!')
    fetchConfig()
  } catch (e) {
    console.error(e)
    alert('Gagal menyimpan konfigurasi: ' + (e.response?.data?.message || e.message))
  } finally {
    isSavingConfig.value = false
  }
}

// --- 2.2 FUNGSI AMBIL DAFTAR TAGIHAN (Pagination) ---
const fetchDuesList = async () => {
  try {
    const res = await axios.get('http://localhost:3000/dues', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // Support format { data: [...] } atau array langsung
    const raw = res.data
    duesList.value = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
  } catch (e) {
    console.error(e)
  }
}

const fetchDuesSummary = async () => {
  try {
    const res = await axios.get('http://localhost:3000/dues/summary', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    duesSummaryList.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error(e)
  }
}

// --- 2.3 FUNGSI GENERATE TAGIHAN (TRIGGER MANUAL) ---
const generateDues = async () => {
  // Kita pakai prompt browser sederhana agar cepat
  // Nanti kalau mau bagus, bisa dibuatkan modal tersendiri
  const periodInput = prompt('Masukkan Periode Tagihan (Contoh: 2023-10):')

  if (!periodInput) return

  try {
    // Konversi period string "2023-10" menjadi Bulan & Tahun angka
    const [year, month] = periodInput.split('-')

    await axios.post('http://localhost:3000/finance/generate-dues', {
      period: periodInput,
      month: parseInt(month),
      year: parseInt(year)
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    alert('Tagihan berhasil dibuat untuk semua anggota aktif!')

    // Refresh daftar status dan ringkasan tagihan
    fetchDuesList()
    fetchDuesSummary()

    // Refresh juga timeline transaksi (agar ada record pembayaran jika ada credit otomatis, nanti)
    fetchTransactions()

  } catch (error) {
    console.error(error)
    alert('Gagal membuat tagihan: ' + error.response?.data?.message || 'Server error')
  }
}

// --- 3. LOGIKA STATISTIK (Computed Properties) ---
const stats = computed(() => {
  const totalIncome = transactions.value
    .filter(t => t.type === 'in')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalExpense = transactions.value
    .filter(t => t.type === 'out')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const balance = totalIncome - totalExpense
  const total = totalIncome + totalExpense
  const incomePercent = total > 0 ? (totalIncome / total) * 100 : 0

  return { totalIncome, totalExpense, balance, incomePercent, total }
})

const summaryByCategory = computed(() => {
  const categories = {}
  transactions.value.forEach(t => {
    if (!categories[t.category]) categories[t.category] = 0
    if (t.type === 'in') categories[t.category] += t.amount
    else categories[t.category] -= t.amount
  })
  return categories
})

// --- Arus Kas Bulanan: data per bulan dari transaksi ---
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const monthlyCashFlow = computed(() => {
  const byMonth = {}
  transactions.value.forEach(t => {
    const dateStr = t.date || ''
    const match = dateStr.match(/^(\d{4})-(\d{2})/)
    const key = match ? `${match[1]}-${match[2]}` : null
    if (!key) return
    if (!byMonth[key]) byMonth[key] = { key, income: 0, expense: 0 }
    if (t.type === 'in') byMonth[key].income += Number(t.amount) || 0
    else byMonth[key].expense += Number(t.amount) || 0
  })
  const sorted = Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key)).slice(-6)
  const maxVal = Math.max(1, ...sorted.flatMap(m => [m.income, m.expense]))
  return sorted.map(m => ({
    ...m,
    net: m.income - m.expense,
    label: (() => {
      const [y, mo] = m.key.split('-')
      return `${MONTH_LABELS[parseInt(mo, 10) - 1]} ${y.slice(2)}`
    })(),
    heightIncome: maxVal > 0 ? (m.income / maxVal) * 100 : 0,
    heightExpense: maxVal > 0 ? (m.expense / maxVal) * 100 : 0
  }))
})
const monthlySummary = computed(() => {
  const data = monthlyCashFlow.value
  const totalIn = data.reduce((s, m) => s + m.income, 0)
  const totalOut = data.reduce((s, m) => s + m.expense, 0)
  const trend = data.length >= 2 ? (data[data.length - 1].net >= data[data.length - 2].net ? 'naik' : 'turun') : 'netral'
  return { totalIn, totalOut, trend }
})

// --- 4. LOGIKA MODAL & ROLE CHECK ---
const isModalOpen = ref(false)
const formType = ref('in')
const incomeSource = ref('anggota')
const formData = ref({ amount: '', category: '', desc: '', targetNia: '' })

// Hanya Bendahara yang boleh Menulis (Tombol FAB)
const isBendahara = computed(() => authStore.user?.role === 'bendahara')

const openModal = (type) => {
  if (!isBendahara.value) {
    alert('Maaf, hanya Bendahara yang dapat menambah transaksi.')
    return
  }
  formType.value = type
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formData.value = { amount: '', category: '', desc: '', targetNia: '' }
  paymentWarning.value = { show: false, message: '' }
}

// --- 5. API CALLS (INI YANG BARU) ---

// Ambil Data dari Backend
const fetchTransactions = async () => {
  try {
    const response = await axios.get('http://localhost:3000/transactions', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    // Isi data dummy dengan data asli
    transactions.value = response.data
  } catch (error) {
    console.error('Gagal ambil data keuangan:', error)
    alert('Gagal memuat data keuangan.')
  }
}

// Simpan Transaksi Baru
const saveTransaction = async () => {
  try {
    // Siapkan payload sesuai format backend; backend akan menentukan periode dari tanggal transaksi
    const payload = {
      type: formType.value,
      amount: formData.value.amount,
      category: formData.value.category,
      description: formData.value.desc,
      subCategory: formType.value === 'in' ? (incomeSource.value === 'anggota' ? 'Kas Anggota' : 'Dana Eksternal') : null,
      targetNia: formData.value.targetNia
    }

    await axios.post('http://localhost:3000/transactions', payload, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    alert('Transaksi berhasil disimpan!')
    closeModal()
    fetchTransactions() // Refresh timeline transaksi
    fetchDuesList()     // Refresh status pembayaran anggota agar langsung terupdate
    fetchDuesSummary()
  } catch (error) {
    console.error(error)
    alert('Gagal menyimpan transaksi: ' + (error.response?.data?.message || error.message))
  }
}

const membersList = ref([]) // List anggota untuk dropdown

const fetchMembers = async () => {
  try {
    // Ambil semua anggota (nanti difilter status Aktif di service frontend biar ringan)
    const res = await axios.get('http://localhost:3000/members', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // Filter hanya yang aktif
    membersList.value = res.data.filter(m => m.status === 'Aktif')
  } catch (error) {
    console.error(error)
  }
}

// --- 2.4 FUNGSI CEK STATUS TAGIHAN (NOTIFIKASI INSTANT) ---
const checkDuesStatus = async (memberNia) => {
  try {
    // Gunakan periode berdasarkan tanggal saat ini untuk pengecekan instan
    const today = new Date();
    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const res = await axios.get('http://localhost:3000/dues/check-status', {
      params: { nia: memberNia, period },
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    if (res.data) {
      // Update state notifikasi
      paymentWarning.value = {
        show: true,
        message: res.data.status === 'OVERPAID'
          ? `Kredit: ${formatIDR(res.data.creditBalance || 0)}`
          : res.data.status === 'PAID'
            ? 'LUNAS'
            : `Kurang: ${formatIDR(res.data.remaining)}`,
        amount: res.data.amountDue, // Jumlah total tagihan
        paid: res.data.amountPaid // Sudah bayar berapa
      }
    } else {
      paymentWarning.value = { show: false, message: '' }
    }
  } catch (error) {
    console.error(error)
    paymentWarning.value = { show: false, message: '' }
  }
}

// Format Currency (Tetap sama)
const formatIDR = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

const displayDuesAmount = (item) => {
  if (item.creditBalance > 0) {
    return formatIDR(item.creditBalance)
  }
  return formatIDR(item.remaining)
}

// --- 6. LOGOUT (Sama) ---
const handleLogout = () => {
  if (confirm('Keluar dari sistem keuangan?')) {
    authStore.logout()
    router.push('/')
  }
}

// Jalankan fetch saat halaman dimuat
onMounted(() => {
  fetchTransactions()
  fetchConfig()
  fetchDuesList()
  fetchDuesSummary()
  fetchMembers()
})
</script>

<template>
  <div :class="['min-h-screen relative overflow-hidden transition-colors duration-500', themeClasses.bg]">

    <!-- BACKGROUND ANIMATION -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div
        class="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob transition-colors duration-500">
      </div>
      <div
        class="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 transition-colors duration-500">
      </div>
    </div>

    <!-- NAVBAR GLASS -->
    <nav :class="['sticky top-0 z-40 transition-all duration-300', themeClasses.navGlass]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center gap-3">
            <button @click="goBackToMenu" :class="['transition-colors', themeClasses.btnBack]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m7 7V5a3 3 0 01-3 3h-4M3 8h4a3 3 0 013 3v8a3 3 0 01-3 3h-4a3 3 0 01-3-3V8z">
                </path>
              </svg>
            </button>
            <div class="flex items-center gap-3 cursor-default">
              <div
                class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/30">
                F
              </div>
              <div>
                <h1 :class="['font-bold text-xl tracking-wide', themeClasses.text]">
                  HMTI <span class="font-light opacity-70">FINANCE</span>
                </h1>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <button @click="themeStore.toggleTheme()" class="p-2 rounded-full hover:bg-white/10 transition">
              <span v-if="isDarkMode">☀️</span><span v-else>🌙</span>
            </button>
            <button @click="handleLogout"
              class="text-sm font-bold px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition">
              KELUAR
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">

      <!-- HEADER HALAMAN (Judul + Tombol Kembali Mobile) -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- MAIN CONTENT -->
        <div>
          <h1 :class="[
            'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text mb-2 leading-tight md:leading-tight break-words whitespace-normal',
            isDarkMode
              ? 'bg-gradient-to-r from-amber-300 via-white to-amber-200'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800'
          ]">
            Manajemen Keuangan
          </h1>
          <p class="text-blue-200 text-lg font-light">Pusat data dan informasi arus kas HMTI.</p>
        </div>
        <div class="flex flex-col gap-2 items-end">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
      </div>

      <!-- 1. TOP STATS CARDS (GRID 3 KOLOM) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- CARD 1: TOTAL SALDO (GLOW) -->
        <div :class="['p-6 rounded-2xl relative overflow-hidden group', themeClasses.cardGlass]">
          <div
            class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition">
          </div>
          <div class="relative z-10">
            <h3 :class="['text-sm font-bold uppercase tracking-wider mb-2', themeClasses.textMuted]">Total Saldo Aktif
            </h3>
            <div :class="['text-3xl md:text-4xl font-extrabold', themeClasses.text]">
              {{ formatIDR(stats.balance) }}
            </div>
            <div class="mt-2 text-xs flex items-center gap-1"
              :class="stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
              <span class="inline-block w-2 h-2 rounded-full"
                :class="stats.balance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'"></span>
              {{ stats.balance >= 0 ? 'Kas Sehat' : 'Defisit' }}
            </div>
          </div>
        </div>

        <!-- CARD 2: LINE CHART (VISUAL DUMMY) -->
        <div
          :class="['p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between', themeClasses.cardGlass]">
          <div class="flex justify-between items-center mb-2">
            <h3 :class="['text-sm font-bold uppercase tracking-wider', themeClasses.textMuted]">Arus Kas (Bulanan)</h3>
            <span class="text-xs px-2 py-0.5 rounded"
              :class="monthlySummary.trend === 'naik' ? 'bg-emerald-500/20 text-emerald-400' : monthlySummary.trend === 'turun' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'">
              {{ monthlySummary.trend === 'naik' ? 'Trend Naik' : monthlySummary.trend === 'turun' ? 'Trend Turun' :
              'Netral' }}
            </span>
          </div>
          <!-- Grafik batang: 6 bulan terakhir, Masuk (hijau) vs Keluar (merah) -->
          <div class="flex items-end gap-1 sm:gap-2 h-24 mt-2" v-if="monthlyCashFlow.length > 0">
            <div v-for="m in monthlyCashFlow" :key="m.key" class="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div class="w-full h-14 flex gap-0.5 justify-center items-end">
                <div class="w-2 sm:w-3 rounded-t bg-emerald-500/90 min-h-[3px] transition-all duration-300"
                  :style="{ height: Math.max(2, m.heightIncome) + '%' }" :title="'Masuk: ' + formatIDR(m.income)"></div>
                <div class="w-2 sm:w-3 rounded-t bg-rose-500/90 min-h-[3px] transition-all duration-300"
                  :style="{ height: Math.max(2, m.heightExpense) + '%' }" :title="'Keluar: ' + formatIDR(m.expense)">
                </div>
              </div>
              <span :class="['text-[10px] font-medium truncate w-full text-center', themeClasses.textMuted]">{{ m.label
                }}</span>
            </div>
          </div>
          <div v-else class="h-20 flex items-center justify-center" :class="themeClasses.textMuted">
            <span class="text-xs">Belum ada data transaksi per bulan.</span>
          </div>
          <!-- Ringkasan penting -->
          <div class="flex justify-between text-xs mt-3 pt-3 border-t gap-2 flex-wrap"
            :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
            <span><span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Masuk: <strong
                :class="themeClasses.text">{{ formatIDR(monthlySummary.totalIn) }}</strong></span>
            <span><span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span> Keluar: <strong
                :class="themeClasses.text">{{ formatIDR(monthlySummary.totalOut) }}</strong></span>
          </div>
        </div>

        <!-- CARD 3: PIE CHART (VISUAL DUMMY) -->
        <div
          :class="['p-6 rounded-2xl relative overflow-hidden flex items-center justify-between', themeClasses.cardGlass]">
          <div>
            <h3 :class="['text-sm font-bold uppercase tracking-wider mb-1', themeClasses.textMuted]">Perbandingan</h3>
            <div class="flex gap-2 text-xs mt-2">
              <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Masuk</div>
              <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Keluar</div>
            </div>
          </div>
          <!-- CSS Pie Chart Visual -->
          <div class="w-16 h-16 rounded-full relative"
            :style="`background: conic-gradient(#10b981 0% ${stats.incomePercent || 0}%, #f43f5e ${stats.incomePercent || 0}% 100%)`">
            <div class="absolute inset-2 m-auto rounded-full" :class="isDarkMode ? 'bg-slate-800' : 'bg-white'"></div>
          </div>
        </div>
      </div>

      <!-- 2. MAIN SPLIT CONTENT (TIMELINE + SUMMARY) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- LEFT COLUMN: TRANSACTION TIMELINE (70%) -->
        <div class="lg:col-span-2 space-y-6">
          <div class="flex justify-between items-center">
            <h2 :class="['text-xl font-bold', themeClasses.text]">Riwayat Transaksi</h2>
            <button class="text-sm text-blue-500 hover:underline">Lihat Semua</button>
          </div>

          <!-- Timeline Container -->
          <div class="relative pl-4 border-l-2" :class="themeClasses.timelineLine">

            <div v-for="(t, index) in transactions" :key="t.id || index" class="mb-8 relative group">
              <!-- Timeline Dot -->
              <div class="absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 transition-colors" :class="[
                isDarkMode ? 'bg-slate-900 border-slate-700 group-hover:border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-500',
                t.type === 'in' ? 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              ]"></div>

              <!-- Card Content -->
              <div
                :class="['p-4 rounded-xl border transition-all duration-300 hover:translate-x-2', themeClasses.cardContent]">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-bold uppercase px-2 py-0.5 rounded text-white"
                        :class="t.type === 'in' ? 'bg-emerald-500' : 'bg-rose-500'">
                        {{ t.type === 'in' ? 'MASUK' : 'KELUAR' }}
                      </span>
                      <span :class="['text-xs font-mono', isDarkMode ? 'text-blue-200/90' : 'opacity-60']">{{ t.date
                        }}</span>
                    </div>
                    <h4 :class="['font-bold text-lg', themeClasses.text]">{{ t.desc }}</h4>
                    <div class="flex gap-2 mt-2">
                      <span class="text-xs px-2 py-1 rounded border"
                        :class="isDarkMode ? 'border-white/10 text-blue-300' : 'border-slate-200 text-slate-600'">#{{
                        t.category }}</span>
                      <span v-if="t.subCategory" class="text-xs px-2 py-1 rounded border"
                        :class="isDarkMode ? 'border-white/10 text-blue-300' : 'border-slate-200 text-slate-600'">#{{
                        t.subCategory }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      :class="['font-bold text-xl', t.type === 'in' ? themeClasses.incomeColor : themeClasses.expenseColor]">
                      {{ t.type === 'in' ? '+' : '-' }} {{ formatIDR(t.amount) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- RIGHT COLUMN: QUICK SUMMARY -->
        <div class="space-y-6">
          <!-- KONFIGURASI IURAN BULANAN -->
          <div :class="['p-6 rounded-2xl border transition-all duration-300', themeClasses.cardGlass]">
            <h2 :class="['text-xl font-bold mb-4 flex items-center gap-2', themeClasses.text]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Konfigurasi Iuran Bulanan
            </h2>
            <p :class="['text-sm mb-4', themeClasses.textMuted]">Atur nominal kas, denda, dan tanggal tenggat setiap
              bulan.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.textMuted]">Nominal Kas
                  per Bulan (Rp)</label>
                <input type="number" v-model.number="configForm.duesAmount" min="0" placeholder="0"
                  :class="['w-full px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
              </div>
              <div>
                <label :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.textMuted]">Denda
                  Keterlambatan (Rp)</label>
                <input type="number" v-model.number="configForm.lateFee" min="0" placeholder="0"
                  :class="['w-full px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
              </div>
              <div>
                <label
                  :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.textMuted]">Tanggal
                  Tenggat (1–31)</label>
                <input type="number" v-model.number="configForm.dueDay" min="1" max="31" placeholder="10"
                  :class="['w-full px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
              </div>
              <div>
                <label
                  :class="['block text-xs font-bold uppercase tracking-wider mb-2', themeClasses.textMuted]">Tanggal
                  Akhir Bayar (1–31)</label>
                <input type="number" v-model.number="configForm.finalDay" min="1" max="31" placeholder="15"
                  :class="['w-full px-4 py-3 outline-none transition-all', themeClasses.inputBg]">
              </div>
            </div>

            <div class="mt-4 pt-4 border-t flex flex-wrap items-center gap-3"
              :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
              <span :class="['text-xs', themeClasses.textMuted]">Contoh: Tenggat tgl {{ configForm.dueDay || 10 }},
                bayar setelah tgl {{ configForm.finalDay || 15 }} kena denda {{ formatIDR(configForm.lateFee || 0)
                }}.</span>
              <button type="button" @click="saveConfig" :disabled="isSavingConfig" :class="[
                'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
                isBendahara
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'opacity-60 cursor-not-allowed bg-slate-500 text-white'
              ]">
                {{ isSavingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi' }}
              </button>
              <span v-if="!isBendahara" :class="['text-xs', themeClasses.textMuted]">Hanya Bendahara yang dapat
                mengubah.</span>
            </div>
          </div>

          <h2 :class="['text-xl font-bold', themeClasses.text]">Status Pembayaran Anggota</h2>
          <!-- Tombol Generate -->
          <button v-if="isBendahara" @click="generateDues"
            class="text-base bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition">
            + Buat Tagihan Bulan Ini
          </button>



          <!-- List Kartu Anggota -->
          <div :class="['p-5 rounded-2xl border space-y-3 max-h-[400px] overflow-y-auto', themeClasses.cardContent]">
            <div v-if="!duesSummaryList || duesSummaryList.length === 0" class="text-center py-4 opacity-50">Belum ada data tagihan.
            </div>

            <div v-for="item in duesSummaryList" :key="item.member?.nia"
              class="flex justify-between items-center p-3 rounded-lg border last:border-0"
              :class="isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
              <div class="flex flex-col">
                <span :class="['font-bold text-sm', themeClasses.text]">{{ item.member?.name || '-' }}</span>
                <span :class="['text-xs', themeClasses.textMuted]">{{ item.member?.angkatan || '-' }}</span>
                <span class="text-[10px] opacity-70">{{ item.periodsCount }} periode tagihan</span>
              </div>

              <div class="text-right">
                <div :class="['text-xs font-bold px-2 py-1 rounded mb-1 inline-block',
                  item.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.status === 'OVERPAID' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-rose-500/20 text-rose-400']">
                  {{ item.status }}
                </div>
                <div :class="['text-xs font-bold', themeClasses.text]">
                  {{ displayDuesAmount(item) }}
                  <span class="text-[10px] font-normal opacity-60">
                    {{ item.creditBalance > 0 ? 'Kredit' : 'Sisa' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- FLOATING ACTION BUTTON (FAB) -->
    <div class="fixed bottom-8 right-8 z-50 flex flex-col gap-4 items-end">
      <!-- Tambah Uang Masuk -->
      <button v-if="isBendahara" @click="openModal('in')"
        class="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg shadow-emerald-500/40 transition-all hover:scale-105 group">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
        <span class="font-bold">Uang Masuk</span>
      </button>

      <!-- Tambah Uang Keluar -->
      <button v-if="isBendahara" @click="openModal('out')"
        class="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-full shadow-lg shadow-rose-500/40 transition-all hover:scale-105">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
        <span class="font-bold">Uang Keluar</span>
      </button>
    </div>

    <!-- SMART ENTRY MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

      <div
        :class="['relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 overflow-hidden', isDarkMode ? 'text-white' : 'text-slate-900 bg-white border-slate-200']">

        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">
            {{ formType === 'in' ? 'Input Pemasukan' : 'Input Pengeluaran' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-white">✕</button>
        </div>

        <div class="space-y-4">

          <!-- Toggle Sumber Dana -->
          <div v-if="formType === 'in'" class="p-1 bg-black/20 rounded-lg flex text-sm font-medium">
            <button type="button" @click="incomeSource = 'anggota'"
              :class="['flex-1 py-2 rounded-md transition-all', incomeSource === 'anggota' ? 'bg-blue-600 shadow text-white' : 'text-gray-400 hover:text-white']">
              Kas Anggota
            </button>
            <button type="button" @click="incomeSource = 'eksternal'"
              :class="['flex-1 py-2 rounded-md transition-all', incomeSource === 'eksternal' ? 'bg-blue-600 shadow text-white' : 'text-gray-400 hover:text-white']">
              Dana Eksternal
            </button>
          </div>

          <!-- NOTIFIKASI INSTAN (Hanya muncul jika Kas Anggota) -->
          <div v-if="formType === 'in' && incomeSource === 'anggota' && paymentWarning && paymentWarning.show"
            class="p-3 mb-4 rounded-xl border flex items-center gap-3 animate-fade-in" :class="paymentWarning && typeof paymentWarning.message === 'string' && paymentWarning.message.includes('LUNAS')
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-300'">
            <span class="text-2xl">⚠️</span>
            <div>
              <div class="font-bold text-sm">{{ paymentWarning ? paymentWarning.message : '' }}</div>
              <div class="text-xs opacity-80">
                Total: {{ formatIDR(paymentWarning && paymentWarning.amount != null ? paymentWarning.amount : 0) }} |
                Sudah Bayar: {{ formatIDR(paymentWarning && paymentWarning.paid != null ? paymentWarning.paid : 0) }}
              </div>
            </div>
          </div>

          <!-- Form Fields -->
          <div v-if="formType === 'in' && incomeSource === 'anggota'">
            <!-- Dropdown Pilih Anggota -->
            <div class="mb-4">
              <label class="block text-xs font-bold uppercase mb-1 text-blue-700 dark:text-blue-300">Pilih
                Anggota</label>
              <select v-model="formData.targetNia" @change="checkDuesStatus(formData.targetNia)" :class="[
                'w-full bg-black/20 border border-white/10 rounded-lg p-3 font-semibold',
                isDarkMode ? 'text-white' : 'text-gray-900',
                'placeholder-gray-400 focus:border-blue-500 outline-none cursor-pointer'
              ]">
                <option value="" disabled class="text-gray-500">Pilih anggota...</option>
                <option v-for="m in membersList" :key="m.nia || m.id || m" :value="m.nia"
                  :class="isDarkMode ? 'text-white bg-slate-900' : 'text-gray-900 bg-white'">
                  {{ m.name }} ({{ m.nia }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Nominal (Rp)</label>
              <input type="number" v-model="formData.amount" placeholder="0"
                class="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none">
            </div>
            <!-- Hapus input kategori, kategori otomatis -->
            <input type="hidden" v-model="formData.category" value="Kas Anggota" />
          </div>

          <div v-else>
            <div>
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Nominal (Rp)</label>
              <input type="number" v-model="formData.amount" placeholder="0"
                class="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Kategori</label>
              <input type="text" v-model="formData.category" placeholder="Cth: Operasional"
                class="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase opacity-70 mb-1">Keterangan</label>
            <textarea v-model="formData.desc" rows="2" placeholder="Deskripsi singkat..."
              class="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none"></textarea>
          </div>

          <!-- Tombol Input Data -->
          <div class="mt-6 flex justify-end">
            <button @click="() => {
              if (formType === 'in' && incomeSource === 'anggota') {
                formData.category = 'Kas Anggota';
              }
              saveTransaction();
            }"
              class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition-all">
              Simpan
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
  animation: blob 10s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
</style>