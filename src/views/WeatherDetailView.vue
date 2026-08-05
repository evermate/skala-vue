<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KOREA_CITIES } from '@/utils/koreaCities'
import { WORLD_CITIES } from '@/utils/worldCities'
import { fetchWeatherForCities, getWeatherErrorMessage } from '@/utils/fetchWeather'
import { fetchAirQuality, fetchForecast } from '@/utils/fetchWeatherExtras'
import { useCustomCityStore } from '@/stores/customCityStore'
import MainWeatherCard from '@/components/weatherDetail/MainWeatherCard.vue'
import AirQualityCard from '@/components/weatherDetail/AirQualityCard.vue'
import ForecastCard from '@/components/weatherDetail/ForecastCard.vue'

const route = useRoute()
const router = useRouter()
const customCityStore = useCustomCityStore()

const city = ref(null)
const isDomestic = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')
const customMemo = ref('')

const airQuality = ref(null)
const airQualityLoading = ref(false)

const forecast = ref([])
const forecastLoading = ref(false)
const forecastMocked = ref(false)
const forecastMockReason = ref('')

async function loadMainWeather(target) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [result] = await fetchWeatherForCities([target])
    city.value = result
  } catch (error) {
    errorMessage.value = getWeatherErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

// 미세먼지·예보는 상세 화면을 보조하는 부가 정보라, 메인 날씨와 서로 기다리지 않고
// 각자 준비되는 대로 채워진다. 메인 날씨처럼 API가 다 실패해도 데모 데이터로 채워지므로
// 여기서 catch는 그 데모 생성 로직 자체가 깨지는 경우를 위한 방어용일 뿐이다.
async function loadAirQuality(target) {
  airQualityLoading.value = true
  try {
    airQuality.value = await fetchAirQuality(target)
  } catch {
    airQuality.value = null
  } finally {
    airQualityLoading.value = false
  }
}

async function loadForecast(target) {
  forecastLoading.value = true
  try {
    const result = await fetchForecast(target)
    forecast.value = result.days
    forecastMocked.value = result.mocked
    forecastMockReason.value = result.mockReason ?? ''
  } catch {
    forecast.value = []
  } finally {
    forecastLoading.value = false
  }
}

function loadWeatherFor(target) {
  // 셋 다 위경도만 있으면 되고 서로 의존관계가 없어서, 하나가 끝나야 다음이
  // 시작하는 게 아니라 처음부터 동시에 쏜다.
  loadMainWeather(target)
  loadAirQuality(target)
  loadForecast(target)
}

async function loadCityWeather() {
  const cityId = route.params.cityId

  // "현위치" 버튼처럼 목록에 없는 임의 좌표는 쿼리스트링(lat/lon/name)으로 받는다.
  if (cityId === 'current-location') {
    const lat = Number(route.query.lat)
    const lon = Number(route.query.lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      errorMessage.value = '위치 정보가 없습니다.'
      return
    }
    isDomestic.value = false
    loadWeatherFor({
      id: 'current-location',
      name: route.query.name || '현재 위치',
      lat,
      lon,
    })
    return
  }

  // 커스텀 도시는 mock API에서 비동기로 로드되므로, /weather/custom_XX로 바로
  // 들어온 경우를 위해 조회 전에 로드가 끝날 때까지 기다린다.
  await customCityStore.ensureHydrated()

  const foundInKorea = KOREA_CITIES.find((item) => item.id === cityId)
  const foundInWorld = WORLD_CITIES.find((item) => item.id === cityId)
  const foundCustom = customCityStore.findById(cityId)
  const found = foundInKorea ?? foundInWorld ?? foundCustom

  if (!found) {
    errorMessage.value = '존재하지 않는 도시입니다.'
    return
  }

  isDomestic.value = foundCustom ? foundCustom.region === 'domestic' : Boolean(foundInKorea)
  customMemo.value = foundCustom?.memo ?? ''
  loadWeatherFor(found)
}

function goHome() {
  router.push('/')
}

onMounted(loadCityWeather)
</script>

<template>
  <div class="weather-detail">
    <div class="weather-detail__header">
      <button class="weather-detail__back-btn" @click="goHome">
        <i class="fa-solid fa-arrow-left"></i> 뒤로가기
      </button>
      <h2 class="weather-detail__title">
        <i class="fa-solid fa-location-dot"></i> 상세정보
      </h2>
      <span
        v-if="city"
        class="weather-detail__api-status"
        :class="city.mocked ? 'is-demo' : 'is-live'"
        :title="city.mocked ? `데모 데이터 (${city.mockReason})` : '실시간 API 연동 중'"
      >
        <span class="dot"></span>
      </span>
    </div>

    <p v-if="isLoading" class="weather-detail__empty">
      <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중입니다...
    </p>
    <p v-else-if="errorMessage" class="weather-detail__error">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
    </p>

    <template v-else-if="city">
      <MainWeatherCard :city="city" :is-domestic="isDomestic" :custom-memo="customMemo" />

      <AirQualityCard :air-quality="airQuality" :is-loading="airQualityLoading" />

      <ForecastCard
        :forecast="forecast"
        :is-loading="forecastLoading"
        :mocked="forecastMocked"
        :mock-reason="forecastMockReason"
      />
    </template>
  </div>
</template>

<style scoped>
.weather-detail {
  max-width: 480px;
  margin: 32px auto;
  padding: 0 16px;
}

.weather-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
}

.weather-detail__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 20px;
  color: var(--color-text);
}

.weather-detail__title i {
  color: var(--color-primary-darker);
}

.weather-detail__api-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
}

.weather-detail__api-status .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.weather-detail__api-status.is-live {
  background: var(--color-success-bg);
}

.weather-detail__api-status.is-live .dot {
  background: var(--color-success);
}

.weather-detail__api-status.is-demo {
  background: var(--color-warning-bg);
}

.weather-detail__api-status.is-demo .dot {
  background: var(--color-warning);
}

.weather-detail__empty,
.weather-detail__error {
  margin: 4px 0 18px;
  padding: 10px 16px;
  border-radius: var(--border-radius-medium);
  font-size: 14px;
  text-align: center;
}

.weather-detail__empty {
  color: var(--color-text-light);
}

.weather-detail__error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.weather-detail__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-detail__back-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
