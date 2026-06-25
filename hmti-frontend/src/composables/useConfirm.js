import { ref } from 'vue'

// Singleton state — hanya satu dialog konfirmasi aktif sekaligus
const state = ref({
  show: false,
  message: '',
  resolve: null
})

export function useConfirm() {
  const confirm = (message) => {
    return new Promise((resolve) => {
      state.value = { show: true, message, resolve }
    })
  }

  const answer = (result) => {
    state.value.show = false
    if (state.value.resolve) state.value.resolve(result)
  }

  return { confirmState: state, confirm, answer }
}
