<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboardStore'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import WeatherMap from '@/components/WeatherMap.vue'
import WeatherEffect from '@/components/WeatherEffect.vue'
import WeatherThermometer from '@/components/WeatherThermometer.vue'
import { KOREA_CITIES } from '@/utils/koreaCities'
import { WORLD_CITIES } from '@/utils/worldCities'
import { WEATHER_LEGEND } from '@/utils/openWeatherCode'
import { fetchWeatherForCities, getWeatherErrorMessage } from '@/utils/fetchWeather'
import { reverseGeocode } from '@/utils/fetchWeatherExtras'
import { useDisplayTemp } from '@/composables/useDisplayTemp'

const router = useRouter()

const weatherList = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const currentLocationCity = ref(null)
const currentLocationPlaceName = ref('')
const currentLocationLoading = ref(false)
const currentLocationError = ref('')
const { unitSymbol: currentLocationUnitSymbol, displayTemp: currentLocationDisplayTemp } =
  useDisplayTemp(() => currentLocationCity.value?.temp)

const { region } = storeToRefs(useDashboardStore())
const searchQuery = ref('')
const statusFilter = ref('전체')
const selectedCityInfo = ref('')
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
    weatherList.value = await fetchWeatherForCities(activeCities.value)
  } catch (error) {
    errorMessage.value = getWeatherErrorMessage(error)
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
  focusedCityId.value = null
  selectedCity.value = null
  fetchWeatherList()
}

function onUpdateStatus(status) {
  statusFilter.value = status
}

function onSearchEnter() {
  if (filteredWeatherList.value.length === 1) {
    selectCity(filteredWeatherList.value[0].id)
  }
}

function selectCity(cityId) {
  const city = weatherList.value.find((item) => item.id === cityId)
  if (!city) return
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
  focusedCityId.value = cityId
  selectedCity.value = city
}

function goToDetail(cityId) {
  router.push('/weather/' + cityId)
}

async function onLocate({ lat, lon }) {
  currentLocationLoading.value = true
  currentLocationError.value = ''

  const [weatherResult, placeResult] = await Promise.allSettled([
    fetchWeatherForCities([{ id: 'current-location', name: '현재 위치', lat, lon }]),
    reverseGeocode({ lat, lon }),
  ])

  if (weatherResult.status === 'fulfilled') {
    currentLocationCity.value = weatherResult.value[0]
  } else {
    currentLocationError.value = getWeatherErrorMessage(weatherResult.reason)
  }
  // 지명은 부가 정보라 실패해도 날씨 표시엔 영향 없이 그냥 city.name("현재 위치")으로 남는다.
  if (placeResult.status === 'fulfilled') currentLocationPlaceName.value = placeResult.value

  currentLocationLoading.value = false
}

function selectCurrentLocation() {
  if (!currentLocationCity.value) return
  selectedCityInfo.value = `${currentLocationCity.value.name}이 선택되었습니다.`
  focusedCityId.value = 'current-location'
  selectedCity.value = currentLocationCity.value
}

function goToCurrentLocationDetail() {
  if (!currentLocationCity.value) return
  router.push({
    path: '/weather/current-location',
    query: {
      lat: currentLocationCity.value.lat,
      lon: currentLocationCity.value.lon,
      name: currentLocationPlaceName.value || currentLocationCity.value.name,
    },
  })
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
            @search-enter="onSearchEnter"
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
              :is-focused="item.id === focusedCityId"
              @select-card="selectCity"
              @click-detail="goToDetail"
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
                :all-cities="weatherList"
                :focused-city-id="focusedCityId"
                :region="region"
                @select-city="selectCity"
                @locate="onLocate"
                @view-detail="goToDetail"
              />
            </div>
            <WeatherThermometer :temp="selectedCity?.temp ?? null" />
          </div>
        </BaseDashboardCard>

        <BaseDashboardCard icon="fa-solid fa-location-crosshairs" title="현재 위치 날씨">
          <template v-if="currentLocationCity" #title-extra>
            <button
              type="button"
              class="current-location__detail-btn"
              @click="goToCurrentLocationDetail"
            >
              <i class="fa-solid fa-circle-info"></i> 상세보기
            </button>
          </template>

          <p v-if="currentLocationLoading" class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 현재 위치 날씨를 불러오는 중입니다...
          </p>
          <p v-else-if="currentLocationError" class="weather-dashboard__error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ currentLocationError }}
          </p>
          <div
            v-else-if="currentLocationCity"
            class="current-location"
            :class="{ 'is-focused': selectedCity?.id === 'current-location' }"
            @click="selectCurrentLocation"
          >
            <i class="current-location__icon fa-solid" :class="currentLocationCity.icon"></i>
            <div class="current-location__info">
              <p class="current-location__place">
                {{ currentLocationPlaceName || currentLocationCity.name }}
              </p>
              <p class="current-location__status">{{ currentLocationCity.status }}</p>
            </div>
            <p class="current-location__temp">
              {{ currentLocationDisplayTemp }}{{ currentLocationUnitSymbol }}
            </p>
          </div>
          <p v-else class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 위치 정보를 확인하는 중입니다...
          </p>
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
    top: calc(var(--nav-height) + 24px);
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
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-dashboard__legend-item i {
  color: var(--color-primary-darker);
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
  color: var(--color-text-light);
  text-align: center;
}

.weather-dashboard__error {
  margin: 4px 0 0;
  padding: 10px 16px;
  border-radius: var(--border-radius-medium);
  background: var(--color-error-bg);
  color: var(--color-error);
  font-size: 14px;
  text-align: center;
}

.current-location {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.current-location:hover {
  border-color: var(--color-primary-darker);
}

.current-location.is-focused {
  border-color: var(--color-primary-darker);
  border-width: 2px;
  box-shadow: 0 0 0 2px var(--color-primary-opacity-30);
}

.current-location__icon {
  font-size: 22px;
  color: var(--color-primary-darker);
  flex-shrink: 0;
}

.current-location__info {
  flex: 1;
  min-width: 0;
}

.current-location__place {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-location__status {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.current-location__temp {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text);
  flex-shrink: 0;
}

.current-location__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-small);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.current-location__detail-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}

.weather-dashboard__status {
  margin: 4px 0 0;
  padding: 10px 16px;
  border-radius: var(--border-radius-medium);
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
</style>
