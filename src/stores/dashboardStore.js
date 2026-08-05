import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 라우트 이동해도 상태 유지되게 컴포넌트 밖(Pinia)에 둠.
// TTL 10분, 재진입 시에만 체크. 백그라운드 자동갱신 없음.
const CACHE_TTL_MS = 10 * 60 * 1000

export const useDashboardStore = defineStore('dashboard', () => {
  // 국내/해외 목록 상태. 국내-해외를 왔다갔다해도 서로 캐시를 안 지우게
  // 지역별로 따로 들고 있는다 (하나만 두면 전환할 때마다 이전 지역 캐시가 덮어써짐).
  const region = ref('domestic')
  const weatherListByRegion = ref({ domestic: [], international: [] })
  const weatherListFetchedAt = ref({ domestic: 0, international: 0 })

  const weatherList = computed(() => weatherListByRegion.value[region.value] ?? [])

  // 검색/필터/선택 상태
  const searchQuery = ref('')
  const statusFilter = ref('전체')
  const selectedCityInfo = ref('')
  const selectedCity = ref(null)
  const focusedCityId = ref(null)

  // 현재 위치 상태
  const currentLocationCity = ref(null)
  const currentLocationPlaceName = ref('')
  const currentLocationFetchedAt = ref(0)

  // actions
  function setRegion(value) {
    region.value = value
  }

  function isWeatherListFresh(forRegion) {
    return (
      weatherListByRegion.value[forRegion].length > 0 &&
      Date.now() - weatherListFetchedAt.value[forRegion] < CACHE_TTL_MS
    )
  }

  function setWeatherList(list, forRegion) {
    weatherListByRegion.value[forRegion] = list
    weatherListFetchedAt.value[forRegion] = Date.now()
  }

  function isCurrentLocationFresh() {
    return (
      Boolean(currentLocationCity.value) &&
      Date.now() - currentLocationFetchedAt.value < CACHE_TTL_MS
    )
  }

  function setCurrentLocation(city, placeName) {
    currentLocationCity.value = city
    currentLocationPlaceName.value = placeName
    currentLocationFetchedAt.value = Date.now()
  }

  return {
    region,
    setRegion,
    weatherList,
    isWeatherListFresh,
    setWeatherList,
    searchQuery,
    statusFilter,
    selectedCityInfo,
    selectedCity,
    focusedCityId,
    currentLocationCity,
    currentLocationPlaceName,
    isCurrentLocationFresh,
    setCurrentLocation,
  }
})
