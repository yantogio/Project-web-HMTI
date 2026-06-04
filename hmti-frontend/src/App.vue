<script setup>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const toast = computed(() => authStore.toast)

// Fungsi logout tetap ada untuk dipanggil di halaman admin
const handleLogout = () => {
  authStore.logout()
  window.location.href = '/' // Pindah pakai window.location agar refresh bersih
}
</script>

<template>
  <div :class="['min-h-screen flex flex-col', themeStore.isDarkMode ? 'bg-slate-900' : 'bg-slate-50']">
    
    <!-- TOAST GLOBAL (Tetap ada di sini) -->
    <div 
      v-if="toast.show" 
      class="fixed top-5 right-5 px-6 py-4 rounded shadow-lg text-white z-50 animate-bounce transition-opacity duration-300"
      :class="toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'"
    >
      <div class="font-bold text-lg">{{ toast.message }}</div>
    </div>

    <!-- ROUTER VIEW (Wadah Utama) -->
    <!-- Navbar Admin sekarang ada di dalam halaman admin (Anggota.vue) -->
    <!-- Navbar Public ada di HomeView.vue -->
    <router-view />
  </div>
</template>