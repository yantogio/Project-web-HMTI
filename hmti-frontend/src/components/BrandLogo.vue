<script setup>
import hmtiLogo from '../assets/Icons/LOGO HMTI 2.png'
import ubsLogo  from '../assets/Icons/Logo UBS Landscape.png'

defineProps({
  size:       { type: String,  default: 'md' },   // 'sm' | 'md' | 'lg' | 'xl'
  variant:    { type: String,  default: 'navbar' }, // 'navbar' | 'emblem' | 'hero'
  isDarkMode: { type: Boolean, default: false },
  subtitle:   { type: String,  default: '' },
})
</script>

<template>

  <!-- ══════════════════════════════════════════════════════
       NAVBAR VARIANT
       Layout: [HMTI logo] [UBS logo] │ HMTI · Universitas Bani Saleh
       Transparent bg, full natural aspect ratio
  ══════════════════════════════════════════════════════════ -->
  <div v-if="variant === 'navbar'" class="flex items-center gap-3">

    <!-- Logo HMTI — no container, full natural ratio -->
    <img
      :src="hmtiLogo"
      :class="[
        'object-contain w-auto shrink-0',
        size === 'sm' ? 'h-8'  :
        size === 'lg' ? 'h-12' :
        size === 'xl' ? 'h-16' : 'h-10'
      ]"
      :style="{ filter: isDarkMode ? 'drop-shadow(1px 0 0 rgba(255,255,255,0.95)) drop-shadow(-1px 0 0 rgba(255,255,255,0.95)) drop-shadow(0 1px 0 rgba(255,255,255,0.95)) drop-shadow(0 -1px 0 rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.4))' : 'drop-shadow(0 1px 4px rgba(0,0,0,0.12))' }"
      alt="Logo HMTI"
      draggable="false"
    />

    <!-- Logo UBS — no container, full natural ratio -->
    <img
      :src="ubsLogo"
      :class="[
        'object-contain w-auto shrink-0',
        size === 'sm' ? 'h-7'  :
        size === 'lg' ? 'h-11' :
        size === 'xl' ? 'h-14' : 'h-9'
      ]"
      :style="{ filter: isDarkMode ? 'drop-shadow(1px 0 0 rgba(255,255,255,0.95)) drop-shadow(-1px 0 0 rgba(255,255,255,0.95)) drop-shadow(0 1px 0 rgba(255,255,255,0.95)) drop-shadow(0 -1px 0 rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.4))' : 'drop-shadow(0 1px 4px rgba(0,0,0,0.12))' }"
      alt="Logo UBS"
      draggable="false"
    />

    <!-- Divider vertikal -->
    <div
      class="self-stretch w-px rounded-full shrink-0"
      :class="isDarkMode ? 'bg-white/20' : 'bg-slate-300'"
    ></div>

    <!-- Teks branding -->
    <div class="leading-snug min-w-0">
      <!-- HMTI + subtitle -->
      <div :class="[
        'font-black tracking-wide whitespace-nowrap',
        size === 'sm' ? 'text-sm'  :
        size === 'lg' ? 'text-xl'  :
        size === 'xl' ? 'text-2xl' : 'text-base',
        isDarkMode ? 'text-white' : 'text-slate-900'
      ]">
        HMTI
        <span v-if="subtitle" :class="[
          'ml-1 font-semibold tracking-widest uppercase',
          size === 'sm' ? 'text-xs'   :
          size === 'lg' ? 'text-base' :
          size === 'xl' ? 'text-xl'   : 'text-sm',
          isDarkMode ? 'text-blue-300' : 'text-primary-blue'
        ]">{{ subtitle }}</span>
      </div>
      <!-- Universitas Bani Saleh -->
      <div :class="[
        'font-bold tracking-wide whitespace-nowrap',
        size === 'sm' ? 'text-[10px]' :
        size === 'lg' ? 'text-sm'     :
        size === 'xl' ? 'text-base'   : 'text-xs',
        isDarkMode ? 'text-blue-200/90' : 'text-primary-blue/90'
      ]">
        Universitas Bani Saleh
      </div>
    </div>

  </div>

  <!-- ══════════════════════════════════════════════════════
       EMBLEM VARIANT  (LoginView left panel)
       Kedua logo bersebelahan, ukuran penuh, tanpa teks,
       transparan, animasi floating
  ══════════════════════════════════════════════════════════ -->
  <div v-else-if="variant === 'emblem'"
    class="relative animate-float"
    style="animation-duration: 5s;"
  >
    <!-- Glow ambient di belakang -->
    <div class="absolute inset-0 -m-10 rounded-[60px] blur-2xl animate-pulse-slow"
      :class="isDarkMode ? 'bg-white/[0.06]' : 'bg-white/20'"
    ></div>
    <!-- Outer orbit ring -->
    <div class="absolute -inset-16 rounded-full border border-white/10 pointer-events-none"></div>

    <!-- Kedua logo bersebelahan, full size, transparan -->
    <div class="relative flex items-center gap-5 xl:gap-7">

      <!-- Logo HMTI besar -->
      <img
        :src="hmtiLogo"
        class="w-auto object-contain drop-shadow-2xl h-28 xl:h-36"
        style="filter: drop-shadow(0 4px 24px rgba(255,255,255,0.22)) drop-shadow(0 0 8px rgba(255,255,255,0.1))"
        alt="Logo HMTI"
        draggable="false"
      />

      <!-- Divider halus -->
      <div class="h-20 xl:h-24 w-px rounded-full shrink-0 bg-white/25"></div>

      <!-- Logo UBS besar -->
      <img
        :src="ubsLogo"
        class="w-auto object-contain drop-shadow-2xl h-20 xl:h-28"
        style="filter: drop-shadow(0 4px 24px rgba(255,255,255,0.22)) drop-shadow(0 0 8px rgba(255,255,255,0.1))"
        alt="Logo UBS"
        draggable="false"
      />
    </div>

    <!-- Orbit pulse dot kanan atas -->
    <div class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white/55 border-2 border-white/80 shadow-lg animate-pulse-slow"></div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       HERO VARIANT  (hero/landing sections)
       Usage: <BrandLogo variant="hero" size="xl" />
  ══════════════════════════════════════════════════════════ -->
  <div v-else-if="variant === 'hero'" class="flex flex-col items-center gap-4">
    <!-- Kedua logo berdampingan, transparan -->
    <div class="flex items-center gap-4">
      <img
        :src="hmtiLogo"
        :class="[
          'object-contain w-auto',
          size === 'xl' ? 'h-20' : 'h-14'
        ]"
        :style="{ filter: isDarkMode ? 'drop-shadow(0 2px 12px rgba(255,255,255,0.2))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }"
        alt="Logo HMTI"
        draggable="false"
      />
      <div class="h-14 w-px rounded-full" :class="isDarkMode ? 'bg-white/20' : 'bg-slate-300'" />
      <img
        :src="ubsLogo"
        :class="[
          'object-contain w-auto',
          size === 'xl' ? 'h-16' : 'h-12'
        ]"
        :style="{ filter: isDarkMode ? 'drop-shadow(0 2px 12px rgba(255,255,255,0.2))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }"
        alt="Logo UBS"
        draggable="false"
      />
    </div>
    <!-- Teks -->
    <div class="text-center leading-tight">
      <div :class="['font-black text-2xl tracking-wide', isDarkMode ? 'text-white' : 'text-slate-900']">
        HMTI
        <span v-if="subtitle" class="font-light opacity-60 ml-1">{{ subtitle }}</span>
      </div>
      <div :class="['font-bold text-sm tracking-wide', isDarkMode ? 'text-blue-200/80' : 'text-primary-blue/80']">
        Universitas Bani Saleh
      </div>
    </div>
  </div>

</template>
