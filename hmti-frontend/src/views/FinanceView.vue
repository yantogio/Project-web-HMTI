<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import http from '@/api/http'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
const { confirm: confirmDialog } = useConfirm()

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
      bg: 'bg-cream',
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      cardGlass: 'bg-white border border-amber-200/70 hover:border-primary-blue/30 hover:shadow-lg shadow-md backdrop-blur-sm',
      cardContent: 'bg-white border border-amber-100 shadow-sm',
      inputBg: 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue rounded-xl',
      incomeColor: 'text-emerald-600',
      expenseColor: 'text-rose-600',
      timelineLine: 'border-l-amber-200',
      navGlass: 'bg-cream-light/90 backdrop-blur-md border-b border-amber-200 shadow-sm',
      btnBack: 'text-primary-blue hover:text-primary-blue-dark',
      btnBackMobile: 'bg-white text-stone-700 border-amber-200 hover:bg-cream-light'
    }
  }
})

const modalInputClass = computed(() =>
  isDarkMode.value
    ? 'bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500'
    : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-blue'
)

const modalInactiveTabClass = computed(() =>
  isDarkMode.value
    ? 'text-gray-300 hover:bg-white/10 hover:text-white'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
)

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
    const res = await http.get('/finance/config', {
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
    toastWarning('Tanggal tenggat dan tanggal akhir harus antara 1–31.')
    return
  }
  isSavingConfig.value = true
  try {
    await http.post('/finance/config', {
      duesAmount: Number(duesAmount) || 0,
      lateFee: Number(lateFee) || 0,
      dueDay: Number(dueDay) || 10,
      finalDay: Number(finalDay) || 15
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    toastSuccess('Konfigurasi iuran berhasil disimpan!')
    fetchConfig()
    fetchDuesList()
    fetchDuesSummary()
  } catch (e) {
    console.error(e)
    toastError('Gagal menyimpan konfigurasi: ' + (e.response?.data?.message || e.message))
  } finally {
    isSavingConfig.value = false
  }
}

// --- 2.2 FUNGSI AMBIL DAFTAR TAGIHAN (Pagination) ---
const fetchDuesList = async () => {
  try {
    const res = await http.get('/dues', {
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
    const res = await http.get('/dues/summary', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    duesSummaryList.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error(e)
  }
}

// --- 2.3 FUNGSI TERAPKAN DENDA KETERLAMBATAN (dipanggil otomatis saat page load) ---
const applyLateFees = async () => {
  try {
    await http.post('/finance/apply-late-fees', {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
  } catch (e) {
    console.error('apply-late-fees:', e)
  }
}

// --- 2.4 FUNGSI GENERATE TAGIHAN (TRIGGER MANUAL) ---
const generateDues = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  generatePeriodInput.value = `${yyyy}-${mm}`
  isGenerateModalOpen.value = true
}

// Buka bukti transaksi — dipakai agar SELURUH baris (bukan hanya ikon) merespons tap di mobile.
const openProof = (t) => {
  if (t?.proofUrl && t.proofUrl.startsWith('https://')) {
    window.open(t.proofUrl, '_blank', 'noopener,noreferrer')
  }
}

// Menutup modal generate + memaksa repaint.
// Tanpa nudge scroll ini, overlay backdrop-blur bisa meninggalkan layer usang
// sehingga tombol "Buat Tagihan Bulan Ini" tak dapat diklik lagi sampai halaman di-scroll manual.
const closeGenerateModal = () => {
  isGenerateModalOpen.value = false
  nextTick(() => {
    requestAnimationFrame(() => {
      const y = window.scrollY
      window.scrollTo(0, y + 1)
      window.scrollTo(0, y)
    })
  })
}

const confirmGenerateDues = async () => {
  const periodInput = generatePeriodInput.value.trim()
  if (!periodInput) return

  try {
    const [year, month] = periodInput.split('-')
    await http.post('/finance/generate-dues', {
      period: periodInput,
      month: parseInt(month),
      year: parseInt(year)
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    toastSuccess('Tagihan berhasil dibuat untuk semua anggota aktif!')
    closeGenerateModal()
    fetchDuesList()
    fetchDuesSummary()
    fetchTransactions()
  } catch (error) {
    console.error(error)
    toastError('Gagal membuat tagihan: ' + (error.response?.data?.message || 'Server error'))
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

// --- Grouped Transactions by Month (untuk Riwayat Transaksi) ---
const groupedTransactions = computed(() => {
  const groups = {}
  transactions.value.forEach(t => {
    const dateStr = t.date || ''
    const match = dateStr.match(/^(\d{4})-(\d{2})/)
    const key = match ? `${match[1]}-${match[2]}` : 'Lainnya'
    if (!groups[key]) groups[key] = { key, label: '', items: [] }
    if (match) {
      const [y, mo] = [match[1], match[2]]
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      groups[key].label = `${monthNames[parseInt(mo, 10) - 1]} ${y}`
    } else {
      groups[key].label = 'Lainnya'
    }
    groups[key].items.push(t)
  })
  // Sort descending (terbaru dulu)
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key))
})

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
const paymentMethod = ref('cash')
const proofFile = ref(null)
const isSaving = ref(false)

// --- LAPORAN ---
const reportFrom = ref('')
const reportTo = ref('')
const isDownloading = ref(false)

// --- MODAL GENERATE TAGIHAN ---
const isGenerateModalOpen = ref(false)
const generatePeriodInput = ref('')

// Hanya Bendahara yang boleh Menulis (Tombol FAB)
const isBendahara = computed(() => authStore.user?.role === 'bendahara')

const openModal = (type) => {
  if (!isBendahara.value) {
    toastWarning('Maaf, hanya Bendahara yang dapat menambah transaksi.')
    return
  }
  formType.value = type
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formData.value = { amount: '', category: '', desc: '', targetNia: '' }
  paymentWarning.value = { show: false, message: '' }
  paymentMethod.value = 'cash'
  proofFile.value = null
}

// --- 5. API CALLS (INI YANG BARU) ---

// Ambil Data dari Backend
const fetchTransactions = async () => {
  try {
    const response = await http.get('/transactions', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    // Isi data dummy dengan data asli
    transactions.value = response.data
  } catch (error) {
    console.error('Gagal ambil data keuangan:', error)
    toastError('Gagal memuat data keuangan.')
  }
}

// Simpan Transaksi Baru
const saveTransaction = async () => {
  if (isSaving.value) return

  // Validasi bukti transaksi
  if (formType.value === 'in' && incomeSource.value === 'anggota' && paymentMethod.value === 'non-cash' && !proofFile.value) {
    toastWarning('Bukti transaksi wajib untuk pembayaran non-cash')
    return
  }
  if (formType.value === 'in' && incomeSource.value === 'eksternal' && !proofFile.value) {
    toastWarning('Bukti transaksi wajib untuk dana eksternal')
    return
  }
  if (formType.value === 'out' && !proofFile.value) {
    toastWarning('Bukti transaksi wajib untuk pengeluaran')
    return
  }

  isSaving.value = true
  try {
    let description = formData.value.desc
    if (formType.value === 'in' && incomeSource.value === 'anggota') {
      const suffix = paymentMethod.value === 'cash' ? '[Cash]' : '[Non-Cash]'
      description = description ? `${description} ${suffix}` : suffix
    }

    const fd = new FormData()
    fd.append('type', formType.value)
    fd.append('amount', formData.value.amount)
    fd.append('category', formType.value === 'in' && incomeSource.value === 'anggota' ? 'Kas Anggota' : formData.value.category)
    fd.append('description', description)
    fd.append('subCategory', formType.value === 'in' ? (incomeSource.value === 'anggota' ? 'Kas Anggota' : 'Dana Eksternal') : '')
    if (formData.value.targetNia) fd.append('targetNia', formData.value.targetNia)
    if (formType.value === 'in' && incomeSource.value === 'anggota') {
      fd.append('paymentMethod', paymentMethod.value)
    }
    if (proofFile.value) fd.append('proof', proofFile.value)

    await http.post('/transactions', fd, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    toastSuccess('Transaksi berhasil disimpan!')
    closeModal()
    fetchTransactions()
    fetchDuesList()
    fetchDuesSummary()
  } catch (error) {
    console.error(error)
    toastError('Gagal menyimpan transaksi: ' + (error.response?.data?.message || error.message))
  } finally {
    isSaving.value = false
  }
}

const downloadReport = async (format) => {
  if (!reportFrom.value || !reportTo.value) {
    toastWarning('Pilih rentang tanggal terlebih dahulu')
    return
  }
  isDownloading.value = true
  try {
    const res = await http.get('/transactions/report', {
      params: { from: reportFrom.value, to: reportTo.value, format },
      headers: { Authorization: `Bearer ${authStore.token}` },
      responseType: 'blob'
    })
    const ext = format === 'word' ? 'docx' : 'xlsx'
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan-Keuangan-${reportFrom.value}-${reportTo.value}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    toastError('Gagal download laporan: ' + (error.response?.data?.message || error.message))
  } finally {
    isDownloading.value = false
  }
}

const membersList = ref([]) // List anggota untuk dropdown

const fetchMembers = async () => {
  try {
    // Ambil semua anggota (nanti difilter status Aktif di service frontend biar ringan)
    const res = await http.get('/members', {
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

    const res = await http.get('/dues/check-status', {
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

// Format Currency
const formatIDR = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

// Format Date: ubah ISO / YYYY-MM-DD menjadi "23 Mei 2026 • 11:19"
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const tgl = d.getDate()
    const bln = bulan[d.getMonth()]
    const thn = d.getFullYear()
    const jam = String(d.getHours()).padStart(2, '0')
    const mnt = String(d.getMinutes()).padStart(2, '0')
    return `${tgl} ${bln} ${thn}  •  ${jam}:${mnt}`
  } catch {
    return dateStr
  }
}

const displayDuesAmount = (item) => {
  if (item.creditBalance > 0) {
    return formatIDR(item.creditBalance)
  }
  return formatIDR(item.remaining)
}

const transactionsWithProof = computed(() =>
  transactions.value.filter(t => t.proofUrl)
)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const handleProofFile = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > MAX_FILE_SIZE) {
    toastError('Ukuran file maksimal 5 MB. Silakan kompres file terlebih dahulu.')
    e.target.value = ''
    proofFile.value = null
    return
  }
  proofFile.value = file
}

// --- 6. LOGOUT (Sama) ---
const handleLogout = async () => {
  const ok = await confirmDialog('Keluar dari sistem keuangan?')
  if (ok) {
    authStore.logout()
    router.push('/')
  }
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

// Jalankan fetch saat halaman dimuat
onMounted(async () => {
  // Terapkan denda dulu agar data dues yang diambil sudah akurat
  await applyLateFees()
  await Promise.allSettled([
    fetchTransactions(),
    fetchConfig(),
    fetchDuesList(),
    fetchDuesSummary(),
    fetchMembers()
  ])
  await nextTick()
  setupScrollAnimations()
})

onUnmounted(() => {
  if (scrollObserver) scrollObserver.disconnect()
})
</script>

<template>
  <AdminPageLayout section="FINANCE" accent="amber" variant="rounded" logout-message="Keluar dari modul keuangan?">

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">

      <!-- HEADER HALAMAN (Judul + Tombol Kembali Mobile) -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- MAIN CONTENT -->
        <div>
          <h1 class="hero-fade-up" :class="[
            'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text mb-2 leading-tight md:leading-tight break-words whitespace-normal',
            isDarkMode
              ? 'bg-gradient-to-r from-amber-300 via-white to-amber-200'
              : 'bg-gradient-to-r from-primary-blue via-accent-orange to-accent-orange'
          ]">
            Manajemen Keuangan
          </h1>
          <p class="hero-fade-up" style="animation-delay:0.1s" :class="['text-lg font-light', themeClasses.textMuted]">Pusat data dan informasi arus kas HMTI.</p>
        </div>
        <div class="flex flex-col items-end gap-3">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
      </div>

      <!-- 1. TOP STATS CARDS — Layout 2:1 (Chart Besar + 2 Card Padat) -->
      <div class="scroll-reveal grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- CARD ARUS KAS — 2/3 lebar -->
        <div :class="['md:col-span-2 p-6 rounded-2xl relative overflow-hidden flex flex-col', themeClasses.cardGlass]">
          <!-- Decorative bg blur -->
          <div class="absolute -left-8 -bottom-8 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
            :class="isDarkMode ? 'bg-amber-400' : 'bg-blue-400'"></div>

          <!-- Header -->
          <div class="flex justify-between items-center mb-5 relative z-10">
            <div>
              <h3 :class="['text-base font-extrabold uppercase tracking-widest', themeClasses.textMuted]">Arus Kas Bulanan</h3>
              <p :class="['text-xs mt-0.5', themeClasses.textMuted]">6 bulan terakhir — hover batang untuk detail</p>
            </div>
            <span class="text-xs font-bold px-3 py-1 rounded-full"
              :class="monthlySummary.trend === 'naik'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : monthlySummary.trend === 'turun'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'">
              {{ monthlySummary.trend === 'naik' ? '↑ Trend Naik' : monthlySummary.trend === 'turun' ? '↓ Trend Turun' : '→ Netral' }}
            </span>
          </div>

          <!-- Bar Chart Area -->
          <div class="relative z-10 flex-1">
            <div v-if="monthlyCashFlow.length > 0" class="flex items-end gap-3 h-44">
              <div
                v-for="m in monthlyCashFlow" :key="m.key"
                class="chart-bar-group flex-1 flex flex-col items-center gap-1.5 min-w-0 group/bar cursor-pointer"
              >
                <!-- Tooltip -->
                <div class="chart-tooltip hidden group-hover/bar:flex flex-col items-center absolute -top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div :class="['px-3 py-2 rounded-xl text-xs font-semibold shadow-xl whitespace-nowrap border',
                    isDarkMode ? 'bg-slate-800 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/80']">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Masuk: <strong>{{ formatIDR(m.income) }}</strong></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Keluar: <strong>{{ formatIDR(m.expense) }}</strong></span>
                    </div>
                  </div>
                  <div :class="['w-2.5 h-2.5 rotate-45 -mt-1.5 border-r border-b',
                    isDarkMode ? 'bg-slate-800 border-white/20' : 'bg-white border-slate-200']"></div>
                </div>

                <!-- Bar Pair -->
                <div class="w-full h-36 flex gap-1.5 justify-center items-end relative">
                  <!-- Bar Masuk -->
                  <div
                    class="chart-bar flex-1 rounded-t-lg min-h-[4px] transition-all duration-500 ease-out relative overflow-hidden group-hover/bar:brightness-125"
                    :class="isDarkMode ? 'bg-emerald-500' : 'bg-emerald-500'"
                    :style="{ height: Math.max(3, m.heightIncome) + '%', transitionDelay: '100ms' }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
                  </div>
                  <!-- Bar Keluar -->
                  <div
                    class="chart-bar flex-1 rounded-t-lg min-h-[4px] transition-all duration-500 ease-out relative overflow-hidden group-hover/bar:brightness-125"
                    :class="isDarkMode ? 'bg-rose-500' : 'bg-rose-500'"
                    :style="{ height: Math.max(3, m.heightExpense) + '%', transitionDelay: '200ms' }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
                  </div>
                </div>

                <!-- Label Bulan -->
                <span :class="['text-xs font-bold truncate w-full text-center', themeClasses.textMuted]">{{ m.label }}</span>
              </div>
            </div>
            <div v-else class="h-44 flex items-center justify-center" :class="themeClasses.textMuted">
              <div class="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p class="text-sm">Belum ada data transaksi per bulan.</p>
              </div>
            </div>
          </div>

          <!-- Footer Legend + Ringkasan -->
          <div class="flex flex-wrap justify-between items-center gap-4 mt-5 pt-4 border-t relative z-10"
            :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-2 text-sm font-semibold">
                <span class="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                <span :class="themeClasses.textMuted">Masuk</span>
              </span>
              <span class="flex items-center gap-2 text-sm font-semibold">
                <span class="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span>
                <span :class="themeClasses.textMuted">Keluar</span>
              </span>
            </div>
            <div class="flex gap-5 text-sm">
              <span :class="['font-bold', themeClasses.incomeColor]">+{{ formatIDR(monthlySummary.totalIn) }}</span>
              <span :class="['font-bold', themeClasses.expenseColor]">−{{ formatIDR(monthlySummary.totalOut) }}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: 2 card padat stacked -->
        <div class="flex flex-col gap-4">

          <!-- CARD TOTAL SALDO -->
          <div :class="['p-5 rounded-2xl relative group flex-1', themeClasses.cardGlass]">
            <div class="absolute -right-3 -top-3 w-20 h-20 rounded-full blur-2xl overflow-hidden opacity-20 group-hover:opacity-40 transition pointer-events-none"
              :class="stats.balance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'"></div>
            <div class="relative z-10">
              <p :class="['text-xs font-bold uppercase tracking-widest mb-2', themeClasses.textMuted]">Total Saldo Aktif</p>
              <div :class="['text-2xl md:text-3xl font-extrabold leading-tight', themeClasses.text]">
                {{ formatIDR(stats.balance) }}
              </div>
              <div class="mt-3 flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                  :class="stats.balance >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'">
                  <span class="w-1.5 h-1.5 rounded-full inline-block"
                    :class="stats.balance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                  {{ stats.balance >= 0 ? 'Kas Sehat' : 'Defisit' }}
                </span>
              </div>
              <!-- Mini income vs expense bars -->
              <div class="mt-4 space-y-3 pb-2">
                <div>
                  <div class="flex justify-between text-xs mb-1.5" :class="themeClasses.textMuted">
                    <span>Pemasukan</span>
                    <span :class="themeClasses.incomeColor">{{ formatIDR(stats.totalIncome) }}</span>
                  </div>
                  <div class="h-1.5 rounded-full" :class="isDarkMode ? 'bg-white/10' : 'bg-slate-200'">
                    <div class="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      :style="{ width: stats.incomePercent + '%' }"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-1.5" :class="themeClasses.textMuted">
                    <span>Pengeluaran</span>
                    <span :class="themeClasses.expenseColor">{{ formatIDR(stats.totalExpense) }}</span>
                  </div>
                  <div class="h-1.5 rounded-full" :class="isDarkMode ? 'bg-white/10' : 'bg-slate-200'">
                    <div class="h-full rounded-full bg-rose-500 transition-all duration-700"
                      :style="{ width: (100 - stats.incomePercent) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD PERBANDINGAN -->
          <div :class="['p-5 rounded-2xl relative overflow-hidden group flex-1', themeClasses.cardGlass]">
            <div class="absolute -right-3 -bottom-3 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition pointer-events-none bg-indigo-400"></div>
            <div class="relative z-10 flex flex-col h-full">
              <p :class="['text-xs font-bold uppercase tracking-widest mb-3', themeClasses.textMuted]">Perbandingan Kas</p>
              <div class="flex items-center gap-5 flex-1">
                <!-- Donut Chart CSS -->
                <div class="relative flex-shrink-0">
                  <div class="w-20 h-20 rounded-full transition-all duration-700"
                    :style="`background: conic-gradient(#10b981 0% ${stats.incomePercent || 0}%, #f43f5e ${stats.incomePercent || 0}% 100%)`">
                  </div>
                  <div class="absolute inset-2.5 rounded-full flex items-center justify-center"
                    :class="isDarkMode ? 'bg-slate-800' : 'bg-white'">
                    <span :class="['text-xs font-extrabold', themeClasses.text]">{{ Math.round(stats.incomePercent || 0) }}%</span>
                  </div>
                </div>
                <!-- Legend -->
                <div class="flex flex-col gap-2.5 flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="flex items-center gap-1.5 text-xs font-semibold" :class="themeClasses.textMuted">
                      <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0"></span>Masuk
                    </span>
                    <span :class="['text-xs font-extrabold', themeClasses.incomeColor]">{{ Math.round(stats.incomePercent || 0) }}%</span>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="flex items-center gap-1.5 text-xs font-semibold" :class="themeClasses.textMuted">
                      <span class="w-2.5 h-2.5 rounded-sm bg-rose-500 flex-shrink-0"></span>Keluar
                    </span>
                    <span :class="['text-xs font-extrabold', themeClasses.expenseColor]">{{ Math.round(100 - (stats.incomePercent || 0)) }}%</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 pt-2 border-t"
                    :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
                    <span class="text-xs font-semibold" :class="themeClasses.textMuted">Net</span>
                    <span :class="['text-xs font-extrabold', stats.balance >= 0 ? themeClasses.incomeColor : themeClasses.expenseColor]">
                      {{ stats.balance >= 0 ? '+' : '' }}{{ formatIDR(stats.balance) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- CARD DOWNLOAD LAPORAN (hanya bendahara) -->
      <div v-if="isBendahara" class="scroll-reveal">
        <div :class="['p-6 rounded-2xl', themeClasses.cardGlass]">
          <h2 :class="['text-xl font-bold mb-1 flex items-center gap-2', themeClasses.text]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download Laporan Keuangan
          </h2>
          <p :class="['text-sm mb-5', themeClasses.textMuted]">Unduh laporan transaksi dalam rentang periode tertentu.</p>
          <div class="flex flex-wrap gap-4 items-end">
            <div>
              <label :class="['block text-xs font-bold uppercase mb-1', themeClasses.textMuted]">Dari Tanggal</label>
              <input type="date" v-model="reportFrom" :class="['px-4 py-2.5 rounded-xl outline-none', themeClasses.inputBg]">
            </div>
            <div>
              <label :class="['block text-xs font-bold uppercase mb-1', themeClasses.textMuted]">Sampai Tanggal</label>
              <input type="date" v-model="reportTo" :class="['px-4 py-2.5 rounded-xl outline-none', themeClasses.inputBg]">
            </div>
            <div class="flex gap-3">
              <button @click="downloadReport('excel')" :disabled="isDownloading"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ isDownloading ? 'Loading...' : 'Excel' }}
              </button>
              <button @click="downloadReport('word')" :disabled="isDownloading"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                {{ isDownloading ? 'Loading...' : 'Word' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. MAIN SPLIT CONTENT (TIMELINE + SUMMARY) -->
      <div class="scroll-reveal grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- LEFT COLUMN: TRANSACTION TIMELINE (70%) -->
        <div class="lg:col-span-2 space-y-6">
          <div class="flex justify-between items-center">
            <h2 :class="['text-xl font-bold', themeClasses.text]">Riwayat Transaksi</h2>
            <button class="text-sm text-blue-500 hover:underline">Lihat Semua</button>
          </div>

          <!-- Timeline Container: Grouped by Month -->
          <div v-if="groupedTransactions.length === 0" :class="['text-center py-10 opacity-60', themeClasses.textMuted]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p class="text-base font-medium">Belum ada riwayat transaksi.</p>
          </div>

          <div v-for="group in groupedTransactions" :key="group.key" class="mb-8">

            <!-- ===== MONTH SEPARATOR ===== -->
            <div class="flex items-center gap-3 mb-5 py-2">
              <div class="flex items-center gap-2 px-4 py-2 rounded-full font-extrabold text-sm tracking-widest uppercase shadow-md"
                :class="isDarkMode
                  ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                  : 'bg-blue-600 text-white border border-blue-700 shadow-blue-200'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ group.label }}
              </div>
              <div class="flex-1 h-0.5 rounded-full"
                :class="isDarkMode ? 'bg-gradient-to-r from-amber-400/30 to-transparent' : 'bg-gradient-to-r from-blue-400/40 to-transparent'"
              ></div>
              <span class="text-xs font-bold px-2 py-1 rounded-full"
                :class="isDarkMode ? 'bg-white/10 text-blue-200' : 'bg-blue-100 text-blue-700'"
              >{{ group.items.length }} transaksi</span>
            </div>

            <!-- Transactions in this month (timeline) -->
            <div class="relative pl-5 border-l-2" :class="themeClasses.timelineLine">
              <div v-for="(t, index) in group.items" :key="t.id || index" class="mb-6 relative group">

                <!-- Timeline Dot -->
                <div class="absolute -left-[23px] top-5 w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                  :class="[
                    isDarkMode ? 'bg-slate-900 border-slate-600 group-hover:border-blue-400' : 'bg-white border-slate-300 group-hover:border-blue-500',
                    t.type === 'in' ? 'shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  ]">
                  <div class="w-1.5 h-1.5 rounded-full" :class="t.type === 'in' ? 'bg-emerald-400' : 'bg-rose-400'"></div>
                </div>

                <!-- Card Content -->
                <div :class="['p-5 rounded-2xl border transition-all duration-300 hover:translate-x-1 hover:shadow-md', themeClasses.cardContent]">
                  <div class="flex justify-between items-start gap-4">

                    <!-- LEFT: Info -->
                    <div class="flex-1 min-w-0">

                      <!-- Badge + Tanggal -->
                      <div class="flex items-center gap-2.5 mb-3 flex-wrap">
                        <span class="text-xs font-extrabold uppercase px-3 py-1 rounded-full text-white tracking-wider shadow-sm"
                          :class="t.type === 'in' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'">
                          {{ t.type === 'in' ? '▲ MASUK' : '▼ KELUAR' }}
                        </span>
                        <!-- Tanggal: lebih besar, tegas, dan terbaca -->
                        <span class="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg"
                          :class="isDarkMode
                            ? 'bg-white/10 text-blue-100 border border-white/15'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          {{ formatDate(t.date) }}
                        </span>
                      </div>

                      <!-- Description -->
                      <h4 :class="['font-extrabold text-lg leading-snug mb-2', themeClasses.text]">{{ t.description || '-' }}</h4>

                      <!-- Tags Kategori -->
                      <div class="flex flex-wrap gap-2">
                        <span class="text-sm font-semibold px-3 py-1 rounded-lg border"
                          :class="isDarkMode ? 'border-blue-400/30 text-blue-300 bg-blue-500/10' : 'border-blue-300 text-blue-700 bg-blue-50'">
                          # {{ t.category }}
                        </span>
                        <span v-if="t.subCategory" class="text-sm font-semibold px-3 py-1 rounded-lg border"
                          :class="isDarkMode ? 'border-purple-400/30 text-purple-300 bg-purple-500/10' : 'border-purple-300 text-purple-700 bg-purple-50'">
                          # {{ t.subCategory }}
                        </span>
                      </div>
                    </div>

                    <!-- RIGHT: Nominal -->
                    <div class="text-right flex-shrink-0">
                      <div :class="['font-extrabold text-xl md:text-2xl leading-tight', t.type === 'in' ? themeClasses.incomeColor : themeClasses.expenseColor]">
                        {{ t.type === 'in' ? '+' : '−' }} {{ formatIDR(t.amount) }}
                      </div>
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

          <!-- CARD BUKTI TRANSAKSI -->
          <div :class="['p-5 rounded-2xl border', themeClasses.cardGlass]">
            <h2 :class="['text-base font-bold mb-1 flex items-center gap-2', themeClasses.text]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Bukti Transaksi
            </h2>
            <p :class="['text-xs mb-4', themeClasses.textMuted]">Klik untuk membuka bukti di Google Drive.</p>

            <div v-if="transactionsWithProof.length === 0" :class="['text-center py-6 opacity-50', themeClasses.textMuted]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-xs">Belum ada bukti transaksi yang diupload</p>
            </div>

            <div v-else class="space-y-2 max-h-72 overflow-y-auto">
              <a
                v-for="t in transactionsWithProof"
                :key="t.id"
                :href="t.proofUrl.startsWith('https://') ? t.proofUrl : '#'"
                target="_blank"
                rel="noopener noreferrer"
                @click.prevent="openProof(t)"
                :class="['flex w-full min-h-[44px] items-center gap-3 p-3 rounded-xl border transition-all hover:translate-x-1 group cursor-pointer no-underline', themeClasses.cardContent,
                  isDarkMode ? 'hover:border-indigo-400/40' : 'hover:border-indigo-300 hover:shadow-sm']">
                <div class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  :class="isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="['font-semibold text-xs truncate', themeClasses.text]">{{ t.category }} — {{ t.description }}</p>
                  <p :class="['text-[10px] mt-0.5', themeClasses.textMuted]">{{ formatDate(t.date) }}</p>
                </div>
                <div
                  class="flex-shrink-0 flex items-center justify-center transition w-9 h-9 rounded-lg sm:w-auto sm:h-auto sm:rounded-none"
                  :class="isDarkMode ? 'bg-indigo-500/15 sm:bg-transparent' : 'bg-indigo-50 sm:bg-transparent'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-3.5 sm:w-3.5 text-indigo-400 sm:text-current opacity-90 sm:opacity-40 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </div>
              </a>
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
    <Teleport to="body">
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

      <div
        :class="['relative w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] border', isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900']">

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
              :class="['flex-1 py-2 rounded-md transition-all', incomeSource === 'anggota' ? 'bg-blue-600 shadow text-white' : modalInactiveTabClass]">
              Kas Anggota
            </button>
            <button type="button" @click="incomeSource = 'eksternal'"
              :class="['flex-1 py-2 rounded-md transition-all', incomeSource === 'eksternal' ? 'bg-blue-600 shadow text-white' : modalInactiveTabClass]">
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
          <!-- === KAS ANGGOTA === -->
          <div v-if="formType === 'in' && incomeSource === 'anggota'">
            <div class="mb-4">
              <label :class="['block text-xs font-bold uppercase mb-1', isDarkMode ? 'text-blue-300' : 'text-blue-700']">Pilih Anggota</label>
              <select v-model="formData.targetNia" @change="checkDuesStatus(formData.targetNia)" :class="['w-full rounded-lg p-3 font-semibold outline-none cursor-pointer', modalInputClass]">
                <option value="" disabled class="text-gray-500">Pilih anggota...</option>
                <option v-for="m in membersList" :key="m.nia || m.id || m" :value="m.nia"
                  :class="isDarkMode ? 'text-white bg-slate-900' : 'text-gray-900 bg-white'">
                  {{ m.name }} ({{ m.nia }})
                </option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Nominal (Rp)</label>
              <input type="number" v-model="formData.amount" placeholder="0"
                :class="['w-full rounded-lg p-3 outline-none', modalInputClass]">
            </div>
            <!-- Metode Pembayaran -->
            <div class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-2">Metode Pembayaran</label>
              <div class="p-1 rounded-lg flex text-sm font-medium" :class="isDarkMode ? 'bg-black/20' : 'bg-slate-100'">
                <button type="button" @click="paymentMethod = 'cash'" :class="['flex-1 py-2 rounded-md transition-all', paymentMethod === 'cash' ? 'bg-emerald-600 shadow text-white' : modalInactiveTabClass]">
                  Cash
                </button>
                <button type="button" @click="paymentMethod = 'non-cash'" :class="['flex-1 py-2 rounded-md transition-all', paymentMethod === 'non-cash' ? 'bg-emerald-600 shadow text-white' : modalInactiveTabClass]">
                  Non-Cash
                </button>
              </div>
            </div>
            <!-- Upload bukti — hanya untuk non-cash -->
            <div v-if="paymentMethod === 'non-cash'" class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Bukti Transaksi <span class="text-rose-400">*</span></label>
              <input type="file" accept="image/*,application/pdf" @change="handleProofFile"
                :class="['w-full rounded-lg p-2 outline-none text-sm', modalInputClass]">
              <p class="text-xs opacity-50 mt-1">Format: JPG, PNG, PDF</p>
            </div>
            <input type="hidden" v-model="formData.category" value="Kas Anggota" />
          </div>

          <!-- === DANA EKSTERNAL & PENGELUARAN === -->
          <div v-else>
            <div class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Nominal (Rp)</label>
              <input type="number" v-model="formData.amount" placeholder="0"
                :class="['w-full rounded-lg p-3 outline-none', modalInputClass]">
            </div>
            <div v-if="formType === 'in'" class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Kategori</label>
              <input type="text" v-model="formData.category" placeholder="Cth: Sponsor"
                :class="['w-full rounded-lg p-3 outline-none', modalInputClass]">
            </div>
            <div v-else class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">Kategori</label>
              <input type="text" v-model="formData.category" placeholder="Cth: Operasional"
                :class="['w-full rounded-lg p-3 outline-none', modalInputClass]">
            </div>
            <!-- Upload bukti — wajib untuk eksternal & pengeluaran -->
            <div class="mb-4">
              <label class="block text-xs font-bold uppercase opacity-70 mb-1">
                Bukti Transaksi <span class="text-rose-400">*</span>
              </label>
              <input type="file" accept="image/*,application/pdf" @change="handleProofFile"
                :class="['w-full rounded-lg p-2 outline-none text-sm', modalInputClass]">
              <p class="text-xs opacity-50 mt-1">Format: JPG, PNG, PDF — Wajib diisi</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase opacity-70 mb-1">Keterangan</label>
            <textarea v-model="formData.desc" rows="2" placeholder="Deskripsi singkat..."
              :class="['w-full rounded-lg p-3 outline-none', modalInputClass]"></textarea>
          </div>

          <!-- Tombol Input Data -->
          <div class="mt-6 flex justify-end">
            <button @click="saveTransaction" :disabled="isSaving"
              class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>

        </div>
      </div>

    </div>
    </Teleport>

    <!-- MODAL GENERATE TAGIHAN -->
    <Teleport to="body">
    <div v-if="isGenerateModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeGenerateModal"></div>
      <div :class="['relative w-full max-w-sm rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]',
        isDarkMode ? 'bg-slate-800 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900']">

        <div class="flex justify-between items-center mb-5">
          <h3 class="text-lg font-bold">Buat Tagihan Iuran</h3>
          <button @click="closeGenerateModal" :class="['opacity-50 hover:opacity-100 transition-opacity', isDarkMode ? 'text-white' : 'text-slate-700']">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label :class="['block text-xs font-bold uppercase mb-2', isDarkMode ? 'text-blue-300' : 'text-blue-700']">Periode Tagihan (YYYY-MM)</label>
            <input
              v-model="generatePeriodInput"
              type="text"
              placeholder="Contoh: 2025-06"
              :class="['w-full px-4 py-3 rounded-xl outline-none transition-all', isDarkMode ? 'bg-white/5 border border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500' : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-blue']"
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button @click="closeGenerateModal"
              :class="['flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all', isDarkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50']">
              Batal
            </button>
            <button @click="confirmGenerateDues"
              class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
              Buat Tagihan
            </button>
          </div>
        </div>

      </div>
    </div>
    </Teleport>

  </AdminPageLayout>
</template>

