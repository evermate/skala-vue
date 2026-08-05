import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi.js'
import { accessTokenKey } from '@/api/mockHttp.js'

const userStorageKey = 'skala-vue-user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 새로고침해도 로그인 유지되게 localStorage 사용 (configStore 등과 동일 컨벤션).
  const accessToken = ref(localStorage.getItem(accessTokenKey))
  const user = ref(readStoredUser())

  const isLoading = ref(false)
  const errorMessage = ref('')

  // 가입 직후 로그인 폼 자동채움용. 로그인 화면 마운트 시 1회 읽고 비움, localStorage엔 저장 안 함.
  const pendingLoginCredentials = ref(null)

  const isLoggedIn = computed(() => Boolean(accessToken.value && user.value))

  function saveAuthentication({ accessToken: token, user: profile }) {
    accessToken.value = token
    user.value = profile
    localStorage.setItem(accessTokenKey, token)
    localStorage.setItem(userStorageKey, JSON.stringify(profile))
  }

  function clearAuthentication() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem(accessTokenKey)
    localStorage.removeItem(userStorageKey)
  }

  async function login(email, password) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await authApi.login({ email, password })
      saveAuthentication(result)
      return true
    } catch (error) {
      clearAuthentication()
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function signup(email, password, name) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      await authApi.signup({ email, password, name })
      pendingLoginCredentials.value = { email, password }
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    clearAuthentication()
    errorMessage.value = ''
  }

  return {
    accessToken,
    user,
    isLoading,
    errorMessage,
    pendingLoginCredentials,
    isLoggedIn,
    login,
    signup,
    logout,
  }
})
