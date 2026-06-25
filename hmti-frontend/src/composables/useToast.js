import { ref } from 'vue'

// Singleton state — shared across all imports
const toasts = ref([])
let nextId = 0

export function useToast() {
  const close = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const add = (message, type = 'info', duration = 3000) => {
    const id = nextId++
    toasts.value.push({ id, message, type, duration })

    if (type !== 'error' && duration > 0) {
      setTimeout(() => close(id), duration)
    }

    return id
  }

  const success = (message, duration = 3000) => add(message, 'success', duration)
  const error   = (message)                  => add(message, 'error',   0)
  const warning = (message, duration = 4500) => add(message, 'warning', duration)
  const info    = (message, duration = 3000) => add(message, 'info',    duration)

  return { toasts, success, error, warning, info, close }
}
