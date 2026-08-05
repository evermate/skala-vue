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
  // 위임한다. 날씨 값은 여기 저장 안 하고 메모리(weatherById)에만 둔다 — 오래된 값이 굳는 걸 막기 위해.
  const cities = ref([])
  const weatherById = ref({})
  const weatherFetchedAt = ref(0)

  let hydratePromise = null

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

    return city
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
