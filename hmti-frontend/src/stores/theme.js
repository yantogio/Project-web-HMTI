import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: localStorage.getItem('hmti_theme_is_dark') === 'false' ? false : true,
  }),
  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('hmti_theme_is_dark', String(this.isDarkMode))
    },
    setTheme(value) {
      this.isDarkMode = Boolean(value)
      localStorage.setItem('hmti_theme_is_dark', String(this.isDarkMode))
    }
  }
})
