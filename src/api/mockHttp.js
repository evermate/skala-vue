import axios from 'axios'
import { staticMockAdapter } from './staticMockAdapter.js'

// Pages 빌드(정적 호스팅)는 Node 서버가 없어서 브라우저 어댑터로 대체.
// PROD인데 VITE_API_MODE를 안 정해둔 빌드는 안전하게 static으로 기본값을 잡는다
// (server 모드로 잘못 배포되면 Pages에서 모든 API 호출이 조용히 실패하기 때문).
export const isStaticMockMode =
  import.meta.env.VITE_API_MODE === 'static' ||
  (import.meta.env.PROD && import.meta.env.VITE_API_MODE !== 'server')

const baseURL = isStaticMockMode
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const mockHttp = axios.create({
  baseURL,
  timeout: 6000,
  ...(isStaticMockMode ? { adapter: staticMockAdapter } : {}),
})

export const accessTokenKey = 'skala-vue-access-token'

// 저장된 토큰이 있으면 모든 요청에 Authorization 헤더를 자동으로 붙인다. 로컬 Node
// 서버/브라우저 정적 어댑터 둘 다 이 인스턴스 하나를 거치므로 여기 한 곳만 고치면 된다.
mockHttp.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(accessTokenKey)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

mockHttp.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (isStaticMockMode
        ? '브라우저 Mock API를 처리할 수 없습니다.'
        : 'Mock API 서버에 연결할 수 없습니다. npm run dev:all로 실행했는지 확인하세요.')
    return Promise.reject(new Error(message))
  },
)
