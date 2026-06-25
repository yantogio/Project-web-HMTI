<script setup>
import { computed } from 'vue'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
import { useThemeStore } from '../stores/theme'

const { toasts, close } = useToast()
const { confirmState, answer } = useConfirm()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const typeConfig = {
  success: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>`,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-l-emerald-500',
    bar: 'bg-emerald-500',
    label: 'Berhasil'
  },
  error: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd"/></svg>`,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-l-rose-500',
    bar: 'bg-rose-500',
    label: 'Terjadi Kesalahan'
  },
  warning: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>`,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-l-amber-500',
    bar: 'bg-amber-500',
    label: 'Perhatian'
  },
  info: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>`,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-l-blue-500',
    bar: 'bg-blue-500',
    label: 'Informasi'
  }
}
</script>

<template>
  <Teleport to="body">

    <!-- ===== TOAST LIST ===== -->
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto relative overflow-hidden rounded-2xl border-l-4 shadow-2xl"
          :class="[
            typeConfig[toast.type].border,
            isDark
              ? 'bg-slate-800/95 backdrop-blur-xl border-t border-r border-b border-white/10 text-white shadow-black/60'
              : 'bg-white/95 backdrop-blur-xl border-t border-r border-b border-slate-200 text-slate-900 shadow-slate-300/60'
          ]"
        >
          <!-- Card Body -->
          <div class="flex items-start gap-3 px-4 pt-4" :class="toast.type !== 'error' ? 'pb-3' : 'pb-4'">
            <!-- Icon -->
            <div
              class="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
              :class="[typeConfig[toast.type].bg, typeConfig[toast.type].color]"
            >
              <div class="w-5 h-5" v-html="typeConfig[toast.type].icon"></div>
            </div>

            <!-- Text -->
            <div class="flex-1 min-w-0 pt-0.5">
              <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5" :class="typeConfig[toast.type].color">
                {{ typeConfig[toast.type].label }}
              </p>
              <p class="text-sm font-semibold leading-snug">{{ toast.message }}</p>
            </div>

            <!-- Close Button -->
            <button
              @click="close(toast.id)"
              class="shrink-0 p-1 rounded-lg transition-colors opacity-40 hover:opacity-100 mt-0.5"
              :class="isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Progress Bar (hanya untuk non-error) -->
          <div v-if="toast.type !== 'error'" class="h-1 w-full" :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
            <div
              class="h-full rounded-full progress-shrink"
              :class="typeConfig[toast.type].bar"
              :style="{ animationDuration: `${toast.duration}ms` }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- ===== CONFIRM DIALOG ===== -->
    <Transition name="confirm-overlay">
      <div
        v-if="confirmState.show"
        class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="answer(false)"
        ></div>

        <!-- Dialog Card -->
        <Transition name="confirm-card">
          <div
            v-if="confirmState.show"
            class="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            :class="isDark
              ? 'bg-slate-800 border border-white/10 text-white shadow-black/60'
              : 'bg-white border border-slate-200 text-slate-900 shadow-slate-300/50'"
          >
            <!-- Top accent bar -->
            <div class="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500"></div>

            <div class="p-6">
              <!-- Icon -->
              <div class="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4 bg-amber-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
              </div>

              <!-- Message -->
              <p class="text-center font-semibold text-base leading-relaxed mb-6">
                {{ confirmState.message }}
              </p>

              <!-- Buttons -->
              <div class="flex gap-3">
                <button
                  @click="answer(false)"
                  class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all"
                  :class="isDark
                    ? 'border-white/10 text-slate-300 hover:bg-white/5'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                >
                  Batal
                </button>
                <button
                  @click="answer(true)"
                  class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

  </Teleport>
</template>

<style scoped>
/* ===== TOAST TRANSITIONS ===== */
.toast-enter-from {
  opacity: 0;
  transform: translateX(110%) scale(0.85);
}
.toast-enter-active {
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.toast-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
  max-height: 200px;
}
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 1, 1);
  overflow: hidden;
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(110%) scale(0.85);
  max-height: 0;
}

/* ===== CONFIRM TRANSITIONS ===== */
.confirm-overlay-enter-from,
.confirm-overlay-leave-to {
  opacity: 0;
}
.confirm-overlay-enter-active,
.confirm-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.confirm-card-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
}
.confirm-card-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-card-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* ===== PROGRESS BAR ===== */
.progress-shrink {
  animation: shrink linear forwards;
}

@keyframes shrink {
  from { width: 100%; }
  to   { width: 0%;   }
}
</style>
