<template>
  <div class="fixed bottom-6 left-6 z-50 flex flex-col items-start">
    <div class="flex flex-col-reverse items-start gap-3 mb-3">
      <button
        v-for="item in visibleItems"
        :key="item.path"
        @click="navigate(item.path)"
        type="button"
        class="flex items-center gap-3 rounded-full bg-slate-900/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-slate-900/30 border border-white/10 transition-all duration-300 ease-out"
        :class="{
          'opacity-100 translate-y-0 scale-100': isOpen,
          'opacity-0 translate-y-3 scale-95 pointer-events-none': !isOpen
        }"
        :style="{ transitionDelay: isOpen ? `${item.index * 50}ms` : `${(visibleItems.length - item.index) * 30}ms` }"
      >
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-inner">
          {{ item.icon }}
        </span>
        <span>{{ item.label }}</span>
      </button>
    </div>

    <button
      type="button"
      @click="toggleOpen"
      class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/30 ring-2 ring-white/20 transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
      :aria-expanded="String(isOpen)"
      aria-label="Buka navigasi cepat"
    >
      <svg
        class="h-8 w-8 transition-transform duration-300"
        :class="isOpen ? 'rotate-45' : 'rotate-0'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isOpen = ref(false)

const navItems = [
  { path: '/admin/members', label: 'Manajemen Anggota', icon: '👥' },
  { path: '/admin/finance', label: 'Keuangan & Kas', icon: '💰' },
  { path: '/admin/docs', label: 'Dokumentasi', icon: '📁' },
  { path: '/admin/showcase', label: 'Showcase Hub', icon: '🎯' },
  { path: '/admin/profile', label: 'Edit Profil', icon: '🧑‍💼' }
]

const currentPath = computed(() => route.path.replace(/\/$/, '') || '/')
const visibleItems = computed(() =>
  navItems
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.path !== currentPath.value)
)

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const navigate = async (path) => {
  isOpen.value = false
  await router.push(path)
}

watch(
  () => route.path,
  () => {
    isOpen.value = false
  }
)</script>

<style scoped>
button {
  will-change: transform, opacity
}
</style>
