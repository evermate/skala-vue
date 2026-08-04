<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KOREA_CITIES } from '@/utils/koreaCities'
import { WORLD_CITIES } from '@/utils/worldCities'
import { fetchWeatherForCities, getWeatherErrorMessage } from '@/utils/fetchWeather'
import { useDisplayTemp } from '@/composables/useDisplayTemp'

const route = useRoute()
const router = useRouter()

const city = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const { unitSymbol, displayTemp } = useDisplayTemp(() => city.value?.temp)

async function loadCityWeather() {
  const cityId = route.params.cityId
  const found = [...KOREA_CITIES, ...WORLD_CITIES].find((item) => item.id === cityId)

  if (!found) {
    errorMessage.value = '존재하지 않는 도시입니다.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [result] = await fetchWeatherForCities([found])
    city.value = result
  } catch (error) {
    errorMessage.value = getWeatherErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function goHome() {
  router.push('/')
}

onMounted(loadCityWeather)
</script>

<template>
  <div class="weather-detail">
    <h2 class="weather-detail__title">
      <i class="fa-solid fa-location-dot"></i> 지역별 상세 기상관측 정보
    </h2>

    <p v-if="isLoading" class="weather-detail__empty">
      <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중입니다...
    </p>
    <p v-else-if="errorMessage" class="weather-detail__error">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
    </p>

    <div v-else-if="city" class="weather-detail__card">
      <p class="weather-detail__place">
        <i class="fa-solid fa-location-dot"></i> 지정 지역: 대한민국 {{ city.name }}
      </p>
      <dl class="weather-detail__list">
        <div class="weather-detail__row">
          <dt><i class="fa-solid fa-temperature-half"></i> 실시간 기온</dt>
          <dd>{{ displayTemp }}{{ unitSymbol }}</dd>
        </div>
        <div class="weather-detail__row">
          <dt><i class="fa-solid" :class="city.icon"></i> 기상 현황</dt>
          <dd>{{ city.status }}</dd>
        </div>
        <div class="weather-detail__row">
          <dt><i class="fa-solid fa-droplet"></i> 습도</dt>
          <dd>{{ city.humidity }}%</dd>
        </div>
        <div class="weather-detail__row">
          <dt><i class="fa-solid fa-wind"></i> 풍속</dt>
          <dd>{{ city.windSpeed }}m/s</dd>
        </div>
      </dl>
    </div>

    <button class="weather-detail__back-btn" @click="goHome">
      <i class="fa-solid fa-arrow-left"></i> 메인 대시보드로 돌아가기
    </button>
  </div>
</template>

<style scoped>
.weather-detail {
  max-width: 480px;
  margin: 32px auto;
  padding: 0 16px;
}

.weather-detail__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 20px;
  color: var(--color-text);
}

.weather-detail__title i {
  color: var(--color-primary-darker);
}

.weather-detail__card {
  background: var(--color-card-background);
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  padding: 20px 22px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-card);
}

.weather-detail__place {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.weather-detail__place i {
  color: var(--color-primary-darker);
}

.weather-detail__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.weather-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.weather-detail__row dt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.weather-detail__row dt i {
  width: 16px;
  color: var(--color-primary-darker);
}

.weather-detail__row dd {
  margin: 0;
  font-weight: 700;
  color: var(--color-text);
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
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.weather-detail__back-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
