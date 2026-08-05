<script setup>
import { ref, computed, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useCustomCityStore } from '@/stores/customCityStore'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import WeatherMap from '@/components/WeatherMap.vue'
import WeatherEffect from '@/components/WeatherEffect.vue'
import WeatherThermometer from '@/components/WeatherThermometer.vue'
import CitySearchModal from '@/components/CitySearchModal.vue'
import { KOREA_CITIES } from '@/utils/koreaCities'
import { WORLD_CITIES } from '@/utils/worldCities'
import { fetchWeatherForCities, getWeatherErrorMessage } from '@/utils/fetchWeather'
import { reverseGeocode } from '@/utils/fetchWeatherExtras'
import { useDisplayTemp } from '@/composables/useDisplayTemp'
import { withSubjectParticle } from '@/utils/korean'

const router = useRouter()
const dashboardStore = useDashboardStore()
const customCityStore = useCustomCityStore()

const {
  region,
  weatherList,
  searchQuery,
  statusFilter,
  selectedCityInfo,
  selectedCity,
  focusedCityId,
  currentLocationCity,
  currentLocationPlaceName,
} = storeToRefs(dashboardStore)

const isLoading = ref(false)
const errorMessage = ref('')

const currentLocationLoading = ref(false)
const currentLocationError = ref('')
const { unitSymbol: currentLocationUnitSymbol, displayTemp: currentLocationDisplayTemp } =
  useDisplayTemp(() => currentLocationCity.value?.temp)
// WeatherCard의 더움/선선함 판정과 동일하게 표시 단위와 무관하게 원본(섭씨) 값 기준으로 유지한다.
const currentLocationIsWarm = computed(() => (currentLocationCity.value?.temp ?? 0) >= 25)

const activeCities = computed(() => (region.value === 'domestic' ? KOREA_CITIES : WORLD_CITIES))

const isCityModalOpen = ref(false)

// customCityStore는 지역 무관하게 도시를 통째로 들고 있어서, 화면에 쓸 때는 항상 현재
// region으로 걸러서 쓴다. 고정 목록과 똑같은 방식으로 목록/지도에 자연스럽게 편입된다.
const customCitiesForRegion = computed(() => customCityStore.citiesForRegion(region.value))
const customWeatherForRegion = computed(() => customCityStore.weatherListForRegion(region.value))
// 지도 fitToBounds용. 날씨가 아직 안 온 커스텀 도시도 좌표만 있으면 범위 계산엔 포함한다.
const combinedAllCities = computed(() => [...weatherList.value, ...customCitiesForRegion.value])
// 검색/필터/카드 목록용. 날씨가 도착한 커스텀 도시만 고정 도시와 동일하게 취급한다.
const combinedWeatherList = computed(() => [...weatherList.value, ...customWeatherForRegion.value])

// 콤마로 여러 도시명을 한 번에 검색할 수 있게 한다(예: "서울, 부산" 입력 시 서울 또는 부산 매칭).
// weatherList 자체가 이미 다 불러와 있는 목록(국내 22개/해외 14개)이라 API 재호출 없이
// 메모리 안에서 필터만 확장하는 거라 추가 비용은 없다.
const searchTerms = computed(() =>
  searchQuery.value
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean),
)

// 검색어까지만 반영한 목록. 상태 필터 칩의 선택지를 여기서 뽑아서
// 지금 검색된 도시들 중에 실제로 존재하는 상태만 칩으로 보여준다.
const searchedWeatherList = computed(() =>
  combinedWeatherList.value.filter(
    (item) =>
      searchTerms.value.length === 0 || searchTerms.value.some((term) => item.name.includes(term)),
  ),
)

const statusOptions = computed(() => [
  '전체',
  ...new Set(searchedWeatherList.value.map((item) => item.status)),
])

const filteredWeatherList = computed(() =>
  searchedWeatherList.value.filter(
    (item) => statusFilter.value === '전체' || item.status === statusFilter.value,
  ),
)

// 데모 데이터로 폴백된 상태면 그 이유(요청 한도 초과 등)를 카드 우상단에 보여준다.
const weatherApiNotice = computed(
  () => combinedWeatherList.value.find((item) => item.mocked)?.mockReason,
)

// 검색어가 바뀌어서 지금 선택된 상태 칩이 더 이상 후보에 없으면(예: "비" 선택 중
// "서울"(맑음)을 검색), 칩이 안 보이는데 필터는 걸려 있어 결과가 0개로 보이는
// 함정을 막기 위해 전체로 되돌린다.
watch(statusOptions, (options) => {
  if (!options.includes(statusFilter.value)) {
    statusFilter.value = '전체'
  }
})

// 캐시가 아직 안 지났으면 WeatherMap한테 넘겨서 geolocation을 다시 안 묻고
// 마커만 조용히 복원하게 한다. 지났으면 null을 넘겨서 진짜로 다시 찾게 한다.
const cachedCurrentLocation = computed(() =>
  dashboardStore.isCurrentLocationFresh() ? currentLocationCity.value : null,
)

// 상세보기를 다녀오는 정도의 재진입에서는 굳이 다시 안 부르고 캐시를 그대로 쓴다.
// (10분 TTL. dashboardStore 참고. 백그라운드 자동 새로고침은 안 하고, 재진입 시점에만 체크한다.)
async function fetchWeatherList({ force = false } = {}) {
  // customCities는 지역별 캐시가 아니라 자체 TTL을 가지므로, 고정 목록 fresh 여부와
  // 무관하게 항상 시도한다(내부적으로 이미 fresh하면 알아서 스킵됨).
  customCityStore.refreshWeather({ force })

  // 이 요청이 어느 지역을 위한 것인지 시작 시점에 고정해둔다. region.value를 나중에
  // (await 이후) 다시 읽으면, 응답이 오기 전에 사용자가 지역을 또 바꿨을 때 늦게 도착한
  // 응답이 그 시점의 region.value 자리에 잘못 저장돼서 국내 목록/지도가 해외 데이터로
  // 오염되는(또는 반대) 레이스 컨디션이 생긴다.
  const targetRegion = region.value
  const isStillCurrent = () => region.value === targetRegion

  if (!force && dashboardStore.isWeatherListFresh(targetRegion)) {
    // 캐시 히트라 여기서 끝나는데, 직전에 다른(이제는 버려진) 지역 요청이 남겨둔
    // isLoading=true가 안 지워진 채 남아있을 수 있다(그 요청은 region이 바뀌어서
    // isStillCurrent()가 false가 되고 자기 finally에서 못 끔). 여기서 확실히 정리한다.
    if (isStillCurrent()) {
      isLoading.value = false
      errorMessage.value = ''
    }
    return
  }

  if (isStillCurrent()) {
    isLoading.value = true
    errorMessage.value = ''
  }

  try {
    const result = await fetchWeatherForCities(activeCities.value)
    dashboardStore.setWeatherList(result, targetRegion)
  } catch (error) {
    if (isStillCurrent()) errorMessage.value = getWeatherErrorMessage(error)
  } finally {
    if (isStillCurrent()) isLoading.value = false
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
  const city = combinedWeatherList.value.find((item) => item.id === cityId)
  if (!city) return
  selectedCityInfo.value = `${withSubjectParticle(city.name)} 선택되었습니다.`
  focusedCityId.value = cityId
  selectedCity.value = city
}

// 삭제 대상이 지금 선택/포커스된 도시면 지도 포커스·온도계·상세보기 버튼이 죽은 참조를
// 보지 않도록 같이 초기화한다.
function deleteCustomCity(cityId) {
  if (selectedCity.value?.id === cityId) {
    selectedCity.value = null
    selectedCityInfo.value = ''
  }
  if (focusedCityId.value === cityId) {
    focusedCityId.value = null
  }
  customCityStore.removeCity(cityId)
}

// 추가 직후엔 방금 추가한 도시가 지금 보고 있는 region과 같을 때만 선택 상태로 전환한다.
function onCityAdded(city) {
  if (city.region === region.value) {
    selectCity(city.id)
  }
}

function editCityMemo(cityId) {
  const city = customCityStore.findById(cityId)
  if (!city) return
  const memo = window.prompt('메모', city.memo ?? '')
  if (memo === null) return
  customCityStore.updateMemo(cityId, memo)
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
    // 지명은 부가 정보라 실패해도 날씨 표시엔 영향 없이 그냥 city.name("현재 위치")으로 남는다.
    const placeName = placeResult.status === 'fulfilled' ? placeResult.value : ''
    dashboardStore.setCurrentLocation(weatherResult.value[0], placeName)
    // 현위치 버튼을 누른 건 내 위치를 보고 싶다는 명시적 의도라, 이전에 선택돼 있던
    // 다른 카드 포커스를 그대로 두지 않고 현재 위치로 선택 상태를 넘긴다.
    selectCurrentLocation()
  } else {
    currentLocationError.value = getWeatherErrorMessage(weatherResult.reason)
  }

  currentLocationLoading.value = false
}

function selectCurrentLocation() {
  if (!currentLocationCity.value) return
  const label = currentLocationPlaceName.value || currentLocationCity.value.name
  selectedCityInfo.value = `${withSubjectParticle(label)} 선택되었습니다.`
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

const DEFAULT_TITLE = '날씨 대시보드'

// 도시가 선택될 때(지도/카드 클릭)마다 토스트로 한 번 더 알려준다. 지도 위
// 상태 문구(selectedCityInfo)는 템플릿 바인딩만으로 이미 뜨지만, 그건 값이
// 바뀔 때 화면을 다시 그리는 반응성 동작이지 부수효과가 아니다. 토스트처럼
// "값이 바뀌면 실행할 동작"이 필요한 경우가 watch를 computed 대신 쓰는 이유다.
watch(selectedCityInfo, (newValue) => {
  if (newValue) ElMessage.info(newValue)
})

// 검색어를 브라우저 탭 제목에 반영한다. 탭 제목은 Vue 템플릿 바깥(document)
// 상태라 computed로는 표현할 수 없고, watchEffect처럼 반응형 값을 읽으면서
// DOM 밖에 부수효과를 내는 API가 필요하다.
watchEffect(() => {
  const query = searchQuery.value.trim()
  document.title = query ? `날씨 - ${query}` : DEFAULT_TITLE
})

onMounted(() => {
  customCityStore.ensureHydrated()
  fetchWeatherList()
})

// 검색어에 맞춰 바뀐 탭 제목이 다른 화면(일지/소개)까지 그대로 묻어가지 않도록
// 이 화면을 벗어날 때 기본값으로 되돌린다.
onBeforeUnmount(() => {
  document.title = DEFAULT_TITLE
})
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
            @open-city-search="isCityModalOpen = true"
          />
        </BaseDashboardCard>

        <BaseDashboardCard
          icon="fa-solid fa-cloud-sun"
          :title="region === 'domestic' ? '국내 날씨 현황' : '해외 날씨 현황'"
        >
          <template
            v-if="
              !isLoading && !errorMessage && !weatherApiNotice && combinedWeatherList.length > 0
            "
            #title-badge
          >
            <span class="weather-dashboard__api-live" title="실시간 API 연동 중">
              <span class="dot"></span>
            </span>
          </template>

          <template v-if="weatherApiNotice" #title-extra>
            <span class="weather-dashboard__api-notice">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ weatherApiNotice }}
            </span>
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
              @delete-city="deleteCustomCity"
              @edit-memo="editCityMemo"
            />
          </ul>
          <p v-else class="weather-dashboard__empty">검색 결과가 일치하는 도시가 없습니다.</p>
        </BaseDashboardCard>
      </div>

      <div class="weather-dashboard__side">
        <BaseDashboardCard
          icon="fa-solid fa-map-location-dot"
          :title="region === 'domestic' ? '국내 지도' : '해외 지도'"
        >
          <template v-if="selectedCityInfo" #title-extra>
            <span class="weather-dashboard__map-status">{{ selectedCityInfo }}</span>
          </template>

          <div class="weather-dashboard__map-row">
            <div class="weather-dashboard__map-wrap">
              <WeatherMap
                :cities="filteredWeatherList"
                :all-cities="combinedAllCities"
                :focused-city-id="focusedCityId"
                :region="region"
                :current-location="cachedCurrentLocation"
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
            <p
              class="current-location__temp"
              :class="currentLocationIsWarm ? 'is-warm' : 'is-cool'"
            >
              {{ currentLocationDisplayTemp }}{{ currentLocationUnitSymbol }}
            </p>
          </div>
          <p v-else class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 위치 정보를 확인하는 중입니다...
          </p>
        </BaseDashboardCard>
      </div>
    </div>

    <CitySearchModal
      v-if="isCityModalOpen"
      :region="region"
      @close="isCityModalOpen = false"
      @added="onCityAdded"
      @select-existing="selectCity"
    />
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

/* 카드 5줄(2열이라 카드 10장) 높이만큼만 보이고 그 아래는 스크롤.
   카드 한 장 높이(padding 16*2 + header 37) 69px * 5줄 + 줄 사이 gap 12px * 4 = 393px.
   맨 윗줄 카드가 hover로 살짝 떠오르면서(translateY) 생기는 그림자/테두리 강조가
   스크롤 컨테이너 위 경계에 그대로 잘려서(overflow-y clip) 위 카드 영역에 씹혀 보이는 걸
   막기 위해 상단 패딩을 8px 주고, 5줄이 그대로 다 보이도록 그만큼 max-height도 늘린다.

   최소 컬럼폭 270px: 카드 안 고정폭 요소(상세보기 탭 padding-right 78px + 아이콘 24px +
   온도 라벨 블록 ~77px + gap들)만으로 이미 ~220px를 차지해서, 220px를 최소값으로 두면
   2열이 겨우 들어가는 컨테이너 폭에서 카드가 과하게 눌려 도시 이름이 "서울" 같은
   2글자조차 바로 잘리는 구간이 생겼다(WeatherCard.vue의 이름을 2줄 clamp로 바꿨어도
   폭이 이 정도로 좁으면 "서"/"울"처럼 한 글자씩 쪼개져서 더 안 좋음). 270px면 2열일 때
   짧은 이름은 한 줄에 넉넉히 들어가고, 4~7글자 정도의 긴 이름만 "싱가포/르"처럼
   그나마 읽을 만하게 두 줄로 감기며, 그마저 부족하면 1열로 자연스럽게 떨어진다. */
.weather-dashboard__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 12px;
  max-height: 401px;
  margin: 0;
  padding: 8px 10px 0 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color-default) transparent;
}

.weather-dashboard__list::-webkit-scrollbar {
  width: 6px;
}

.weather-dashboard__list::-webkit-scrollbar-track {
  background: transparent;
}

.weather-dashboard__list::-webkit-scrollbar-thumb {
  background: var(--border-color-default);
  border-radius: 999px;
}

.weather-dashboard__list::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-darker);
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
  flex-shrink: 0;
}

.current-location__temp.is-warm {
  color: var(--color-warm);
}

.current-location__temp.is-cool {
  color: var(--color-info);
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

.weather-dashboard__map-status {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.weather-dashboard__api-notice {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-error-bg);
  color: var(--color-error);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.weather-dashboard__api-live {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  background: var(--color-success-bg);
}

.weather-dashboard__api-live .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
}
</style>
