<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'
import WeatherMap from './WeatherMap.vue'
import WeatherEffect from './WeatherEffect.vue'
import WeatherThermometer from './WeatherThermometer.vue'
import { KOREA_CITIES } from '@/utils/koreaCities'
import { WORLD_CITIES } from '@/utils/worldCities'
import { getWeatherInfo, WEATHER_LEGEND } from '@/utils/weatherCode'

const weatherList = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const region = ref('domestic')
const searchQuery = ref('')
const statusFilter = ref('전체')
const selectedCityInfo = ref('')
const expandedCityId = ref(null)
const focusedCityId = ref(null)
const selectedCity = ref(null)

const activeCities = computed(() => (region.value === 'domestic' ? KOREA_CITIES : WORLD_CITIES))

const statusOptions = computed(() => [
  '전체',
  ...new Set(weatherList.value.map((item) => item.status)),
])

const filteredWeatherList = computed(() =>
  weatherList.value.filter(
    (item) =>
      item.name.includes(searchQuery.value) &&
      (statusFilter.value === '전체' || item.status === statusFilter.value),
  ),
)

async function fetchWeatherList() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const cities = activeCities.value
    const latitude = cities.map((city) => city.lat).join(',')
    const longitude = cities.map((city) => city.lon).join(',')
    const fields =
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weathercode'
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${fields}&timezone=Asia%2FSeoul`

    const response = await fetch(url)
    if (!response.ok) throw new Error('날씨 데이터를 불러오지 못했습니다.')

    const results = await response.json()

    weatherList.value = cities.map((city, index) => {
      const current = results[index]?.current
      const { status, icon } = getWeatherInfo(current?.weathercode)
      return {
        id: city.id,
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        temp: Math.round(current?.temperature_2m ?? 0),
        feelsLike: Math.round(current?.apparent_temperature ?? 0),
        humidity: Math.round(current?.relative_humidity_2m ?? 0),
        windSpeed: current?.wind_speed_10m ?? 0,
        status,
        icon,
      }
    })
  } catch {
    errorMessage.value = '날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

function onUpdateQuery(value) {
  searchQuery.value = value
}

function onUpdateRegion(value) {
  if (region.value === value) return
  region.value = value
  searchQuery.value = ''
  statusFilter.value = '전체'
  expandedCityId.value = null
  focusedCityId.value = null
  selectedCity.value = null
  fetchWeatherList()
}

function onUpdateStatus(status) {
  statusFilter.value = status
}

function selectCity(cityId) {
  const city = weatherList.value.find((item) => item.id === cityId)
  if (!city) return
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
  focusedCityId.value = cityId
  selectedCity.value = city
}

function toggleDetail(cityId) {
  expandedCityId.value = expandedCityId.value === cityId ? null : cityId
}

watch(selectedCityInfo, (newValue) => {
  console.log('[watch 감지] 상태바 문구가 업데이트되었습니다 ->', newValue)
})

watchEffect(() => {
  console.log('[watchEffect 자동 호출] 현재 검색어:', searchQuery.value)
})

onMounted(fetchWeatherList)
</script>

<template>
  <div class="weather-dashboard">
    <WeatherEffect :status="selectedCity?.status ?? null" />

    <h2 class="weather-dashboard__title">
      <i class="fa-solid fa-cloud-sun-rain"></i> 과제 4: 날씨 (컴포넌트)
    </h2>

    <div class="weather-dashboard__layout">
      <div class="weather-dashboard__main">
        <BaseDashboardCard icon="fa-solid fa-magnifying-glass" title="도시 검색">
          <SearchBar
            :search-query="searchQuery"
            :status-filter="statusFilter"
            :status-options="statusOptions"
            :region="region"
            @update-query="onUpdateQuery"
            @update-status="onUpdateStatus"
            @update-region="onUpdateRegion"
          />
        </BaseDashboardCard>

        <BaseDashboardCard
          icon="fa-solid fa-cloud-sun"
          :title="region === 'domestic' ? '국내 날씨 현황' : '해외 날씨 현황'"
        >
          <template #title-extra>
            <ul class="weather-dashboard__legend">
              <li
                v-for="entry in WEATHER_LEGEND"
                :key="entry.status"
                class="weather-dashboard__legend-item"
              >
                <i :class="entry.icon"></i> {{ entry.status }}
              </li>
            </ul>
          </template>

          <p v-if="isLoading" class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중입니다...
          </p>
          <p v-else-if="errorMessage" class="weather-dashboard__error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
          </p>
          <ul v-else-if="filteredWeatherList.length > 0" class="weather-dashboard__list">
            <WeatherCard
              v-for="item in filteredWeatherList"
              :key="item.id"
              :city="item"
              :is-expanded="item.id === expandedCityId"
              @select-card="selectCity"
              @click-detail="toggleDetail"
            />
          </ul>
          <p v-else class="weather-dashboard__empty">검색 결과가 일치하는 도시가 없습니다.</p>
        </BaseDashboardCard>

        <p class="weather-dashboard__status">
          {{ selectedCityInfo || '카드를 클릭하거나 검색해 보세요.' }}
        </p>
      </div>

      <div class="weather-dashboard__side">
        <BaseDashboardCard
          icon="fa-solid fa-map-location-dot"
          :title="region === 'domestic' ? '국내 지도' : '해외 지도'"
        >
          <div class="weather-dashboard__map-row">
            <div class="weather-dashboard__map-wrap">
              <WeatherMap
                :cities="filteredWeatherList"
                :focused-city-id="focusedCityId"
                :region="region"
                @select-city="selectCity"
              />
            </div>
            <WeatherThermometer :temp="selectedCity?.temp ?? null" />
          </div>
        </BaseDashboardCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-dashboard {
  max-width: 1080px;
  margin: 32px auto;
  padding: 0 16px;
}

.weather-dashboard__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 20px;
  color: var(--text);
}

.weather-dashboard__title i {
  color: var(--aurora-1);
}

.weather-dashboard__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 860px) {
  .weather-dashboard__layout {
    grid-template-columns: minmax(0, 1fr) 440px;
    align-items: start;
  }

  .weather-dashboard__side {
    position: sticky;
    top: 24px;
  }
}

.weather-dashboard__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.weather-dashboard__legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  white-space: nowrap;
}

.weather-dashboard__legend-item i {
  color: var(--aurora-1);
  font-size: 12px;
}

.weather-dashboard__map-row {
  display: flex;
  align-items: stretch;
  height: 360px;
  gap: 12px;
}

.weather-dashboard__map-wrap {
  flex: 1;
  min-width: 0;
}

.weather-dashboard__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
}

.weather-dashboard__empty {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--text-faint);
  text-align: center;
}

.weather-dashboard__error {
  margin: 4px 0 0;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background: var(--error-bg);
  color: var(--error-text);
  font-size: 14px;
  text-align: center;
}

.weather-dashboard__status {
  margin: 4px 0 0;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background: var(--success-bg);
  color: var(--success-text);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
</style>
