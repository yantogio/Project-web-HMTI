<script setup>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import ToastContainer from './components/ToastContainer.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
</script>

<template>
  <div :class="['min-h-screen flex flex-col', themeStore.isDarkMode ? 'bg-slate-900' : 'bg-slate-50']">
    <router-view />
    <ToastContainer />
  </div>
</template>
