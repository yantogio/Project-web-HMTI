<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// ── Mouse parallax tracking ──────────────────────────────────────
const mouseX = ref(0)
const mouseY = ref(0)

function onMouseMove(e) {
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 50
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 50
}

onMounted(() => window.addEventListener('mousemove', onMouseMove, { passive: true }))
onUnmounted(() => window.removeEventListener('mousemove', onMouseMove))

// Each orb moves at a different depth (parallax factor)
const orbDepths = [0.30, -0.45, 0.20, -0.30, 0.38, -0.22, 0.28]
function orbStyle(i) {
  const d = orbDepths[i] ?? 0.3
  return {
    transform: `translate(${mouseX.value * d}px, ${mouseY.value * d}px)`,
    transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    willChange: 'transform',
  }
}

// ── Floating particles (rising from bottom) ──────────────────────
const particles = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:    `${4 + (i * 4.3) % 92}%`,
  size:    `${2 + (i % 3)}px`,
  dur:     `${7 + (i * 0.55) % 6}s`,
  delay:   `-${(i * 0.95) % 9}s`,
  opacity: (0.20 + (i % 5) * 0.07).toFixed(2),
  accent:  i % 4 === 2,
}))

// ── Sparkle glowing dots ─────────────────────────────────────────
const sparkles = [
  { left: '6%',  top: '17%', delay: '0s',   dur: '3.2s', size: 4, accent: false },
  { left: '18%', top: '7%',  delay: '0.9s', dur: '2.6s', size: 3, accent: true  },
  { left: '35%', top: '28%', delay: '1.8s', dur: '3.6s', size: 5, accent: false },
  { left: '50%', top: '5%',  delay: '2.5s', dur: '2.8s', size: 3, accent: true  },
  { left: '64%', top: '22%', delay: '0.4s', dur: '3.4s', size: 4, accent: false },
  { left: '79%', top: '11%', delay: '1.3s', dur: '2.7s', size: 3, accent: true  },
  { left: '91%', top: '37%', delay: '2.1s', dur: '3.8s', size: 4, accent: false },
  { left: '11%', top: '60%', delay: '1.6s', dur: '3.1s', size: 3, accent: false },
  { left: '43%', top: '71%', delay: '0.7s', dur: '3.5s', size: 5, accent: true  },
  { left: '71%', top: '54%', delay: '2.7s', dur: '2.9s', size: 3, accent: false },
  { left: '87%', top: '73%', delay: '1.5s', dur: '3.2s', size: 4, accent: true  },
  { left: '27%', top: '84%', delay: '0.3s', dur: '2.5s', size: 3, accent: false },
]

function sparkleStyle(s, isDarkMode) {
  const blueLight  = 'rgba(46,135,246'
  const orangeAccent = 'rgba(243,92,43'
  const blueDark   = 'rgba(147,197,253'
  const purpleAccent = 'rgba(196,181,253'

  const color = isDarkMode
    ? (s.accent ? '#c4b5fd' : '#93c5fd')
    : (s.accent ? '#f35c2b' : '#2e87f6')

  const shadow = isDarkMode
    ? `0 0 ${s.size * 3}px ${s.size}px ${s.accent ? purpleAccent : blueDark},0.65)`
    : `0 0 ${s.size * 3}px ${s.size}px ${s.accent ? orangeAccent : blueLight},0.40)`

  return {
    left: s.left,
    top: s.top,
    width: `${s.size}px`,
    height: `${s.size}px`,
    background: color,
    boxShadow: shadow,
    animationDelay: s.delay,
    animationDuration: s.dur,
  }
}

// ── Shooting stars ───────────────────────────────────────────────
const shootingStars = [
  { top: '9%',  delay: '0s',  dur: '5s'  },
  { top: '31%', delay: '9s',  dur: '4.5s' },
  { top: '57%', delay: '16s', dur: '6s'  },
]

function starStyle(s, isDarkMode) {
  return {
    top: s.top,
    left: '-5%',
    width: '200px',
    height: '2px',
    borderRadius: '2px',
    background: isDarkMode
      ? 'linear-gradient(90deg, transparent, rgba(147,197,253,0.9), rgba(255,255,255,1), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(46,135,246,0.7), rgba(255,255,255,0.95), transparent)',
    animationDelay: s.delay,
    animationDuration: s.dur,
  }
}

// ── Rotating geometric rings ─────────────────────────────────────
const geoRings = [
  { left: '5%',  top: '28%', size: 130, delay: '0s',  dur: '22s', dashed: false },
  { left: '88%', top: '14%', size: 100, delay: '4s',  dur: '28s', dashed: true  },
  { left: '48%', top: '66%', size: 165, delay: '9s',  dur: '20s', dashed: false },
  { left: '76%', top: '79%', size: 80,  delay: '2s',  dur: '26s', dashed: true  },
]

function geoStyle(g, reverse = false) {
  return {
    left: g.left,
    top: g.top,
    width:  `${g.size}px`,
    height: `${g.size}px`,
    transform: 'translate(-50%, -50%)',
    animationDuration: g.dur,
    animationDelay: g.delay,
    animationDirection: reverse ? 'reverse' : 'normal',
    borderStyle: g.dashed ? 'dashed' : 'solid',
  }
}

// ── Expanding pulse rings ────────────────────────────────────────
const pulseRings = [
  { left: '20%', top: '28%', delay: '0s'  },
  { left: '80%', top: '62%', delay: '2.2s' },
  { left: '50%', top: '83%', delay: '4.4s' },
]
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">

    <!-- ════════════════════════════════
         LAYER 0 · Aurora gradient base
         ════════════════════════════════ -->
    <div class="absolute inset-0" :class="isDarkMode ? 'aurora-dark' : 'aurora-light'"></div>

    <!-- ════════════════════════════════
         LAYER 1 · Parallax orbs
         Each orb in its own wrapper so JS translate + CSS blob don't conflict
         ════════════════════════════════ -->
    <div class="absolute -top-20 left-1/4" :style="orbStyle(0)">
      <div :class="['w-72 h-72 md:w-96 md:h-96 rounded-full filter blur-3xl opacity-25 animate-blob',
        isDarkMode ? 'bg-blue-600' : 'bg-primary-blue/35']"></div>
    </div>

    <div class="absolute top-10 right-1/4" :style="orbStyle(1)">
      <div :class="['w-80 h-80 md:w-96 md:h-96 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000',
        isDarkMode ? 'bg-indigo-600' : 'bg-accent-orange/25']"></div>
    </div>

    <div class="absolute top-1/3 left-10" :style="orbStyle(2)">
      <div :class="['w-64 h-64 md:w-80 md:h-80 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000',
        isDarkMode ? 'bg-purple-600' : 'bg-amber-400/45']"></div>
    </div>

    <div class="absolute top-1/2 right-10" :style="orbStyle(3)">
      <div :class="['w-56 h-56 md:w-72 md:h-72 rounded-full filter blur-3xl opacity-15 animate-blob animation-delay-3000',
        isDarkMode ? 'bg-teal-500' : 'bg-primary-blue/20']"></div>
    </div>

    <div class="absolute bottom-1/4 left-1/4" :style="orbStyle(4)">
      <div :class="['w-72 h-72 rounded-full filter blur-3xl opacity-15 animate-blob animation-delay-1000',
        isDarkMode ? 'bg-pink-600' : 'bg-accent-orange/15']"></div>
    </div>

    <div class="absolute bottom-10 right-1/3" :style="orbStyle(5)">
      <div :class="['w-48 h-48 md:w-64 md:h-64 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-5000',
        isDarkMode ? 'bg-cyan-500' : 'bg-amber-300/40']"></div>
    </div>

    <div v-if="!isDarkMode" class="absolute top-3/4 left-2/3" :style="orbStyle(6)">
      <div class="w-48 h-48 rounded-full filter blur-3xl opacity-25 animate-blob animation-delay-2000 bg-cream-dark/50"></div>
    </div>

    <!-- ════════════════════════════════
         LAYER 2 · Rotating geometric rings (outer + inner counter-rotating)
         ════════════════════════════════ -->
    <div
      v-for="(g, i) in geoRings" :key="`geo-out-${i}`"
      class="absolute rounded-full border animate-spin-slow"
      :class="isDarkMode ? 'border-blue-400/[0.07]' : 'border-primary-blue/[0.07]'"
      :style="geoStyle(g)"
    ></div>

    <template v-for="(g, i) in geoRings" :key="`geo-in-${i}`">
      <div
        class="absolute rounded-full border animate-spin-slow"
        :class="isDarkMode ? 'border-purple-400/[0.05]' : 'border-accent-orange/[0.06]'"
        :style="{
          left: g.left,
          top: g.top,
          width: `${Math.round(g.size * 0.62)}px`,
          height: `${Math.round(g.size * 0.62)}px`,
          transform: 'translate(-50%, -50%)',
          animationDuration: `${parseFloat(g.dur) * 1.3}s`,
          animationDelay: g.delay,
          animationDirection: 'reverse',
          borderStyle: 'dashed',
        }"
      ></div>
    </template>

    <!-- ════════════════════════════════
         LAYER 3 · Expanding pulse rings
         ════════════════════════════════ -->
    <div
      v-for="(r, i) in pulseRings" :key="`ring-${i}`"
      class="animate-pulse-ring"
      :class="isDarkMode ? 'border-blue-400/20' : 'border-primary-blue/[0.12]'"
      :style="{ left: r.left, top: r.top, animationDelay: r.delay }"
    ></div>

    <!-- ════════════════════════════════
         LAYER 4 · Shooting stars
         ════════════════════════════════ -->
    <div
      v-for="(s, i) in shootingStars" :key="`shoot-${i}`"
      class="absolute animate-shoot"
      :style="starStyle(s, isDarkMode)"
    ></div>

    <!-- ════════════════════════════════
         LAYER 5 · Floating rising particles
         ════════════════════════════════ -->
    <div
      v-for="p in particles" :key="`p-${p.id}`"
      class="absolute bottom-0 rounded-full animate-rise"
      :class="p.accent
        ? (isDarkMode ? 'bg-purple-300' : 'bg-accent-orange')
        : (isDarkMode ? 'bg-blue-300'   : 'bg-primary-blue')"
      :style="{
        left: p.left,
        width: p.size,
        height: p.size,
        opacity: p.opacity,
        animationDuration: p.dur,
        animationDelay: p.delay,
      }"
    ></div>

    <!-- ════════════════════════════════
         LAYER 6 · Sparkle glow dots
         ════════════════════════════════ -->
    <div
      v-for="(s, i) in sparkles" :key="`sp-${i}`"
      class="absolute rounded-full animate-sparkle"
      :style="sparkleStyle(s, isDarkMode)"
    ></div>

    <!-- ════════════════════════════════
         LAYER 7 · Radial dot grid
         ════════════════════════════════ -->
    <div
      class="absolute inset-0 opacity-[0.045]"
      :style="{
        backgroundImage: `radial-gradient(${isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(100,116,139,0.65)'} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }"
    ></div>

    <!-- ════════════════════════════════
         LAYER 8 · Noise film-grain texture
         ════════════════════════════════ -->
    <div
      class="absolute inset-0 noise-texture"
      :style="{ opacity: isDarkMode ? 0.03 : 0.02 }"
    ></div>

  </div>
</template>
