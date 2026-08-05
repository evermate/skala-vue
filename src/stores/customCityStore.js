import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchWeatherForCities } from '@/utils/fetchWeather'
import { cityApi } from '@/api/cityApi'

const MAX_CITIES = 20
const CACHE_TTL_MS = 10 * 60 * 1000

function generateId() {
  return `custom_${Date.now()}`
}

export const useCustomCityStore = defineStore('customCity', () => {
  // 도시 레코드(id/name/lat/lon/region/memo)는 mockHttp를 통해 서버(로컬)/브라우저 어댑터(Pages)에
  // 위임한다. 날씨 값은 오래된 값이 굳지 않도록 여기 저장하지 않고 메모리(weatherById)에만 둔다.
  const cities = ref([])
  const weatherById = ref({})
  const weatherFetchedAt = ref(0)

  let hydratePromise = null

  // 여러 컴포넌트가 동시에 호출해도 목록을 한 번만 불러오도록 promise를 캐싱한다.
  // 로드 직후 반드시 날씨까지 같이 받아와야 한다 — 안 그러면 막 hydrate된 도시는
  // 날씨가 없어서 weatherListForRegion 필터에 걸려 목록에서 안 보이게 된다.
  // 실패 시엔 캐시를 비워서 다음 호출이 재시도할 수 있게 한다.
  function ensureHydrated() {
    if (!hydratePromise) {
      hydratePromise = cityApi
        .getAll()
        .then(async (list) => {
          cities.value = list
          await refreshWeather({ force: true })
        })
        .catch(() => {
          hydratePromise = null
        })
    }
    return hydratePromise
  }

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

  async function addCity({ name, lat, lon, region }) {
    const city = await cityApi.create({ id: generateId(), name, lat, lon, region })
    cities.value = [...cities.value, city]

    // 정원 초과 시 가장 먼저 추가된 도시부터 밀어낸다(FIFO, 방문 빈도는 고려 안 함).
    if (cities.value.length > MAX_CITIES) {
      const [oldest, ...rest] = cities.value
      cities.value = rest
      await cityApi.remove(oldest.id)
      const next = { ...weatherById.value }
      delete next[oldest.id]
      weatherById.value = next
    }

    const [result] = await fetchWeatherForCities([city])
    weatherById.value = { ...weatherById.value, [city.id]: result }

    // mocked/mockReason은 호출한 쪽(도시 검색 모달)이 데모 데이터 여부를 바로 안내할 수 있도록
    // 얹어서 돌려준다. cities.value에는 저장하지 않는다(날씨 값은 이 스토어에 영구 저장하지 않음).
    return { ...city, mocked: result.mocked, mockReason: result.mockReason }
  }

  async function removeCity(id) {
    await cityApi.remove(id)
    cities.value = cities.value.filter((city) => city.id !== id)
    const next = { ...weatherById.value }
    delete next[id]
    weatherById.value = next
  }

  async function updateMemo(id, memo) {
    const updated = await cityApi.update(id, { memo })
    cities.value = cities.value.map((city) => (city.id === id ? updated : city))
  }

  function findById(id) {
    return cities.value.find((city) => city.id === id) ?? null
  }

  return {
    cities,
    ensureHydrated,
    citiesForRegion,
    weatherListForRegion,
    refreshWeather,
    addCity,
    removeCity,
    updateMemo,
    findById,
  }
})
