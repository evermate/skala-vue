import { ref } from 'vue'
import { defineStore } from 'pinia'

// 상세보기(WeatherDetailView)를 다녀와도 국내/해외 탭이 유지되도록
// WeatherHomeView 컴포넌트 바깥(Pinia)에 둔다. 컴포넌트는 라우트 이동마다
// 마운트/언마운트되지만 스토어는 앱이 떠 있는 동안 그대로 남는다.
export const useDashboardStore = defineStore('dashboard', () => {
  // state
  const region = ref('domestic')

  // actions
  function setRegion(value) {
    region.value = value
  }

  return { region, setRegion }
})
