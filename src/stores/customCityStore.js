import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchWeatherForCities } from '@/utils/fetchWeather'

const STORAGE_KEY = 'customCities'
const MAX_CITIES = 20
const CACHE_TTL_MS = 10 * 60 * 1000

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(cities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
  } catch {
    // 시크릿 모드 등으로 localStorage가 막혀 있어도 기능 자체는 계속 동작해야 한다.
  }
}

function generateId() {
  return `custom_${Date.now()}`
}

// WeatherDetailView.vue가 /weather/custom_XX로 새로고침·직접 진입해도 목록을 찾을 수 있도록
// configStore.js처럼 스토어 정의 시점에 localStorage에서 즉시 hydrate한다.
export const useCustomCityStore = defineStore('customCity', () => {
  // state — localStorage엔 id/name/lat/lon/region만 저장. 온도 등 날씨 값은 저장하지 않고
  // 메모리(weatherById)에만 둔다 — 저장해두면 며칠 뒤에도 옛날 값이 그대로 남기 때문.
  const cities = ref(loadFromStorage())
  const weatherById = ref({})
  const weatherFetchedAt = ref(0)

  function citiesForRegion(region) {
    return cities.value.filter((city) => city.region === region)
  }

  function weatherListForRegion(region) {
    return cities.value
      .filter((city) => city.region === region)
      .map((city) => ({ ...city, ...weatherById.value[city.id] }))
      .filter((city) => city.temp != null)
  }

  function isWeatherFresh() {
    return cities.value.length === 0 || Date.now() - weatherFetchedAt.value < CACHE_TTL_MS
  }

  // 홈 대시보드 재진입 시점 갱신 트리거 — dashboardStore.js의 isWeatherListFresh와 동일한
  // TTL 패턴. 재진입은 흔한 이벤트가 아니라 여기서 전체를 한 번에 재요청해도 비용 문제 없다.
  async function refreshWeather({ force = false } = {}) {
    if (cities.value.length === 0) return
    if (!force && isWeatherFresh()) return

    const results = await fetchWeatherForCities(cities.value)
    const nextWeatherById = {}
    results.forEach((result) => {
      nextWeatherById[result.id] = result
    })
    weatherById.value = nextWeatherById
    weatherFetchedAt.value = Date.now()
  }

  // 도시 추가 시점 갱신 트리거 — 새로 추가되는 도시 1개만 fetch한다. 이미 있는 도시들까지
  // 통째로 재요청하지 않음: OpenWeatherMap 경로(fetchWeather.js)는 도시마다 개별 axios
  // 요청이라, 전체 재요청은 이미 최신인 도시들에도 불필요한 API 호출을 추가하는 낭비다.
  async function addCity({ name, lat, lon, region }) {
    const city = { id: generateId(), name, lat, lon, region }

    cities.value = [...cities.value, city]
    if (cities.value.length > MAX_CITIES) {
      const [removed, ...rest] = cities.value
      cities.value = rest
      const next = { ...weatherById.value }
      delete next[removed.id]
      weatherById.value = next
    }
    saveToStorage(cities.value)

    const [result] = await fetchWeatherForCities([city])
    weatherById.value = { ...weatherById.value, [city.id]: result }

    return city
  }

  function removeCity(id) {
    cities.value = cities.value.filter((city) => city.id !== id)
    const next = { ...weatherById.value }
    delete next[id]
    weatherById.value = next
    saveToStorage(cities.value)
  }

  function findById(id) {
    return cities.value.find((city) => city.id === id) ?? null
  }

  return {
    cities,
    citiesForRegion,
    weatherListForRegion,
    refreshWeather,
    addCity,
    removeCity,
    findById,
  }
})
