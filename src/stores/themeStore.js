import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'weatherTheme'

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Element Plus 자체 다크 테마도 이 클래스 하나로 같이 켜진다(main.js에서 임포트한
// element-plus/theme-chalk/dark/css-vars.css가 html.dark를 본다).
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = defineStore('theme', () => {
  // 명시적으로 고른 적 없으면 시스템 설정을 초기값으로만 쓴다. 토글 이후엔
  // 시스템 설정이 바뀌어도 사용자가 고른 값이 우선한다.
  const stored = localStorage.getItem(STORAGE_KEY)
  const theme = ref(stored || (systemPrefersDark() ? 'dark' : 'light'))
  applyTheme(theme.value)

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, theme.value)
    applyTheme(theme.value)
  }

  return { theme, toggleTheme }
})
