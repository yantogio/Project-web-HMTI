<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import axios from 'axios' // 1. Import Axios

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// --- 1. STATE & THEME ---
const isDarkMode = computed(() => themeStore.isDarkMode)
const activeTab = ref('info')

// Form Data Pribadi (KOSONG DI AWAL, NANTI DIISI DARI DATABASE)
const profileData = ref({
  name: '',
  role: '',
  email: '',
  phone: '',
  bio: ''
  // Location dihapus karena tidak ada di database
})

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Theme Classes
const themeClasses = computed(() => {
  if (isDarkMode.value) {
    return {
      bg: 'bg-slate-900',
      text: 'text-white',
      textMuted: 'text-blue-200/60',
      cardGlass: 'bg-slate-800/40 border border-white/10 hover:border-white/20 backdrop-blur-md',
      cardContent: 'bg-slate-800/60 border border-white/5',
      inputBg: 'bg-white/5 border-white/10 text-white placeholder-blue-300/40 focus:border-blue-500 focus:bg-white/10',
      readonlyInput: 'bg-slate-700/30 border border-slate-600/30 text-slate-400',
      inputLabel: 'text-blue-200/70',
      saveBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
      navGlass: 'bg-white/10 backdrop-blur-md border-b border-white/10',
      tabActive: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40',
      tabInactive: 'bg-white/5 text-blue-200 hover:bg-white/10',
      btnBack: 'text-blue-200 hover:text-white',
      btnBackMobile: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
      textLightModeFix: 'text-white'
    }
  } else {
    return {
      bg: 'bg-cream',
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      cardGlass: 'bg-white border border-amber-200/70 hover:border-primary-blue/30 hover:shadow-lg shadow-md backdrop-blur-sm',
      cardContent: 'bg-white border border-amber-100 shadow-sm',
      inputBg: 'bg-white border-2 border-primary-blue/40 text-stone-900 placeholder-stone-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15 focus:bg-white shadow-sm',
      readonlyInput: 'bg-cream-dark/40 border-2 border-stone-200 text-stone-400',
      inputLabel: 'text-stone-600',
      navGlass: 'bg-cream-light/90 backdrop-blur-md border-b border-amber-200 shadow-sm',
      tabActive: 'bg-gradient-to-r from-primary-blue to-primary-blue-dark text-white shadow-lg shadow-primary-blue/25',
      tabInactive: 'bg-white text-stone-600 hover:bg-cream-light border border-amber-200',
      btnBack: 'text-primary-blue hover:text-primary-blue-dark',
      btnBackMobile: 'bg-white text-stone-700 border-amber-200 hover:bg-cream-light',
      textLightModeFix: 'text-transparent bg-clip-text bg-gradient-to-r from-primary-blue via-accent-orange to-accent-orange',
      saveBtn: 'bg-gradient-to-r from-accent-orange to-accent-orange-dark hover:from-accent-orange-light hover:to-accent-orange text-white shadow-lg shadow-accent-orange/30',
    }
  }
})

// --- 2. LOGIC API ---

// Ambil data saat halaman dibuka
const fetchMyProfile = async () => {
  try {
    const response = await axios.get('http://localhost:3000/members/me', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    const data = response.data
    // Isi data form dengan hasil dari database
    profileData.value = {
      name: data.name,
      role: data.role,
      email: data.email || '',
      phone: data.phone || '',
      bio: data.bio || ''
    }
  } catch (error) {
    console.error('Gagal ambil profil:', error)
    alert('Gagal memuat data profil.')
  }
}

// Simpan perubahan (Email, Phone, Bio)
const saveProfile = async () => {
  try {
    // Backend updateProfile hanya menerima email, phone, bio (Nama & Role biasanya diatur Admin)
    await axios.patch('http://localhost:3000/members/me', {
      email: profileData.value.email,
      phone: profileData.value.phone,
      bio: profileData.value.bio
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    alert('Profil berhasil diperbarui!')
    // Update nama di store agar Navbar ikut berubah
    if(authStore.user) {
        authStore.user.name = profileData.value.name
    }
  } catch (error) {
    console.error(error)
    alert('Gagal menyimpan profil.')
  }
}

// Ubah Password
const changePassword = async () => {
  // Validasi Frontend
  if(!passwordData.value.currentPassword?.trim()) {
    alert('Masukkan password saat ini.')
    return
  }
  if(passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    alert('Password baru dan konfirmasi tidak cocok!')
    return
  }
  if(passwordData.value.newPassword.length < 6) {
    alert('Password minimal 6 karakter!')
    return
  }

  try {
    await axios.patch('http://localhost:3000/members/me/password', {
      currentPassword: passwordData.value.currentPassword,
      newPassword: passwordData.value.newPassword
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    alert('Password berhasil diubah! Silakan login ulang.')
    // Logout otomatis
    authStore.logout()
    router.push('/login')
    
  } catch (error) {
    console.error(error)
    const msg = error.response?.data?.message || 'Gagal mengubah password. Cek password lama Anda.'
    alert(msg)
  }
}

const goBackToMenu = () => router.push('/admin')

const handleLogout = () => {
  if(confirm('Keluar dari akun?')) {
    authStore.logout()
    router.push('/')
  }
}

// State untuk melihat password (nama harus sama dengan yang dipakai di template)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Jalankan fetch saat halaman dimuat
onMounted(() => {
  fetchMyProfile()
})
</script>

<template>
  <AdminPageLayout section="PROFILE" accent="indigo" variant="rounded" logout-message="Keluar dari akun?">

    <!-- MAIN CONTENT -->
    <main class="relative z-10 max-w-6xl mx-auto px-4 py-8">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1
            class="text-4xl md:text-5xl font-extrabold mb-2 leading-tight md:leading-tight break-words whitespace-normal"
            :class="isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-200' : themeClasses.textLightModeFix">
            Edit Profil
          </h1>
          <p :class="['text-lg font-light', isDarkMode ? 'text-blue-200' : 'text-slate-600']">Kelola informasi diri dan keamanan akun.</p>
        </div>
        
        <div class="flex flex-col items-end gap-3">
          <button @click="goBackToMenu"
            :class="['md:hidden px-4 py-2 rounded-lg text-sm border', themeClasses.btnBackMobile]">
            &larr; Kembali ke Menu
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- LEFT COLUMN: PROFILE VISUAL CARD -->
        <div class="lg:col-span-1">
          <div :class="['p-8 rounded-3xl border text-center relative overflow-hidden group', themeClasses.cardGlass]">
            <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-80"></div>
            
            <div class="relative pt-12">
              <!-- Avatar -->
              <div class="w-32 h-32 mx-auto rounded-full p-1 bg-white/10 backdrop-blur-sm mb-4">
                <img :src="`https://ui-avatars.com/api/?name=${profileData.name}&background=0D8ABC&color=fff&size=256`" 
                     alt="Profile" class="w-full h-full rounded-full object-cover border-4 border-slate-800">
              </div>
              
              <!-- Ubah warna teks ke putih di mode gelap -->
              <h2 :class="['text-2xl font-bold', isDarkMode ? 'text-white' : themeClasses.text]">{{ profileData.name || 'Loading...' }}</h2>
              <div :class="[isDarkMode ? 'text-indigo-200' : 'text-indigo-400', 'font-medium mb-4']">{{ profileData.role }}</div>
              
              <div class="space-y-3 text-left px-4 py-4 rounded-xl border border-dashed"
                   :class="isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'">
                <div class="flex items-center gap-3 text-sm">
                  <span class="opacity-50 w-5">📧</span>
                  <span :class="['truncate', themeClasses.textMuted, isDarkMode ? 'text-white' : '']">{{ profileData.email || '-' }}</span>
                </div>
                <div class="flex items-center gap-3 text-sm">
                  <span class="opacity-50 w-5">📱</span>
                  <span :class="[themeClasses.textMuted, isDarkMode ? 'text-white' : '']">{{ profileData.phone || '-' }}</span>
                </div>
                <!-- PERUBAHAN: LOKASI DIGANTI JABATAN/ROLE -->
                <div class="flex items-center gap-3 text-sm">
                  <span class="opacity-50 w-5">🏢</span>
                  <span :class="['truncate', themeClasses.textMuted, isDarkMode ? 'text-white' : '']">{{ profileData.role }}</span>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
                <p :class="['text-sm italic', isDarkMode ? 'text-white/80' : 'text-slate-600']">"{{ profileData.bio || 'Tidak ada bio.' }}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: SETTINGS FORM -->
        <div class="lg:col-span-2">
          <div :class="['rounded-2xl border overflow-hidden', themeClasses.cardGlass]">
            
            <div class="flex border-b" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
              <button type="button" @click="activeTab = 'info'" 
                :class="['flex-1 py-4 text-center font-bold transition-all text-sm uppercase tracking-wider', activeTab === 'info' ? themeClasses.tabActive : themeClasses.tabInactive]">
                Info Pribadi
              </button>
              <button type="button" @click="activeTab = 'security'" 
                :class="['flex-1 py-4 text-center font-bold transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2', activeTab === 'security' ? themeClasses.tabActive : themeClasses.tabInactive]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Keamanan
              </button>
            </div>

            <div class="p-8">
              
              <!-- TAB 1: INFO PRIBADI -->
              <div v-if="activeTab === 'info'" class="space-y-6 animate-fade-in">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label 
                      :class="['block text-xs font-bold uppercase mb-2', themeClasses.inputLabel]"
                    >Nama Lengkap</label>
                    <!-- Nama dibuat readonly karena backend updateProfile kita saat ini hanya handle email, phone, bio -->
                    <input type="text" v-model="profileData.name" readonly
                      :class="['w-full rounded-xl px-4 py-3 outline-none opacity-60 cursor-not-allowed', themeClasses.readonlyInput]">
                  </div>
                  <div>
                    <label 
                      :class="['block text-xs font-bold uppercase mb-2', themeClasses.inputLabel]"
                    >Jabatan</label>
                    <input type="text" v-model="profileData.role" readonly
                      :class="['w-full rounded-xl px-4 py-3 outline-none opacity-60 cursor-not-allowed', themeClasses.readonlyInput]">
                  </div>
                  <div>
                    <label 
                      :class="['block text-xs font-bold uppercase mb-2', themeClasses.inputLabel]"
                    >Email</label>
                    <input type="email" v-model="profileData.email" 
                      :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg, isDarkMode ? 'text-white' : '']">
                  </div>
                  <div>
                    <label 
                      :class="['block text-xs font-bold uppercase mb-2', themeClasses.inputLabel]"
                    >No. HP</label>
                    <input type="tel" v-model="profileData.phone" 
                      :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg, isDarkMode ? 'text-white' : '']">
                  </div>
                </div>
                
                <div>
                  <label 
                    :class="['block text-xs font-bold uppercase mb-2', themeClasses.inputLabel]"
                  >Bio Singkat</label>
                  <textarea v-model="profileData.bio" rows="3" 
                    :class="['w-full rounded-xl px-4 py-3 outline-none transition-all', themeClasses.inputBg, isDarkMode ? 'text-white' : '']"></textarea>
                </div>

                <div class="flex justify-end">
                  <button @click="saveProfile"
                    :class="['px-8 py-3 rounded-xl font-bold transition-all', themeClasses.saveBtn]">
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              <!-- TAB 2: KEAMANAN -->
              <div v-if="activeTab === 'security'" class="space-y-6 animate-fade-in">
                <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6 flex gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p :class="['text-sm', themeClasses.textMuted]">
                    Pastikan password baru Anda kuat. Gunakan kombinasi huruf, angka, dan simbol.
                  </p>
                </div>

                <div>
                  <label :class="['block text-xs font-bold uppercase opacity-70 mb-2', themeClasses.text]">Password Saat Ini</label>
                  <div class="relative">
                    <input 
                      :type="showCurrentPassword ? 'text' : 'password'" 
                      v-model="passwordData.currentPassword" 
                      placeholder="••••••••" 
                      autocomplete="current-password"
                      :class="['w-full rounded-xl px-4 py-3 outline-none transition-all pr-12', themeClasses.inputBg]"
                    >
                    <button 
                      type="button" 
                      @click.prevent="showCurrentPassword = !showCurrentPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
                      tabindex="-1"
                      aria-label="Toggle password visibility"
                    >
                      <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12A3 3 0 119 12a3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.542-7a9.969 9.969 0 012.424-4.257M7.362 7.362A3 3 0 0115 12m-3 3a3 3 0 01-3-3" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label :class="['block text-xs font-bold uppercase opacity-70 mb-2', themeClasses.text]">Password Baru</label>
                    <div class="relative">
                      <input 
                        :type="showNewPassword ? 'text' : 'password'" 
                        v-model="passwordData.newPassword" 
                        placeholder="Minimal 6 karakter" 
                        autocomplete="new-password"
                        :class="['w-full rounded-xl px-4 py-3 outline-none transition-all pr-12', themeClasses.inputBg]"
                      >
                      <button 
                        type="button" 
                        @click.prevent="showNewPassword = !showNewPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
                        tabindex="-1"
                        aria-label="Toggle password visibility"
                      >
                        <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12A3 3 0 119 12a3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.542-7a9.969 9.969 0 012.424-4.257M7.362 7.362A3 3 0 0115 12m-3 3a3 3 0 01-3-3" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label :class="['block text-xs font-bold uppercase opacity-70 mb-2', themeClasses.text]">Konfirmasi Password</label>
                    <div class="relative">
                      <input 
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        v-model="passwordData.confirmPassword" 
                        placeholder="Ulangi password baru" 
                        autocomplete="new-password"
                        :class="['w-full rounded-xl px-4 py-3 outline-none transition-all pr-12', themeClasses.inputBg]"
                      >
                      <button 
                        type="button" 
                        @click.prevent="showConfirmPassword = !showConfirmPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
                        tabindex="-1"
                        aria-label="Toggle password visibility"
                      >
                        <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12A3 3 0 119 12a3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.542-7a9.969 9.969 0 012.424-4.257M7.362 7.362A3 3 0 0115 12m-3 3a3 3 0 01-3-3" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="pt-4 flex justify-end">
                  <button type="button" @click="changePassword" 
                    class="px-8 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-500/30 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.999 21H9a2 2 0 01-2-2v-4a2 2 0 00-2-2H3a2 2 0 01-2-2V7a2 2 0 012-2h2.743a6 6 0 011.257-1.028L9 4h6l1.257 1.972A6 6 0 0117.743 5H20a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2v4a2 2 0 01-2 2h-3l-2.257 3.257A6 6 0 0112 21z" /></svg>
                    Ubah Password
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>

  </AdminPageLayout>
</template>

