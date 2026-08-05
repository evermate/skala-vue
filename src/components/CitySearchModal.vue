<script setup>
import { ref } from 'vue'
import { geocodeCity } from '@/utils/geocodeCity'
import { findDuplicateCity } from '@/utils/findDuplicateCity'
import { useCustomCityStore } from '@/stores/customCityStore'
import { withSubjectParticle } from '@/utils/korean'

const props = defineProps({
  region: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'added', 'select-existing'])

const customCityStore = useCustomCityStore()

const query = ref('')
const isSearching = ref(false)
const searchError = ref('')
const results = ref([])

const isAdding = ref(false)
const addNotice = ref('')
const addError = ref('')
const isAddedWeatherMocked = ref(false)

async function onSearch() {
  if (!query.value.trim() || isSearching.value) return

  isSearching.value = true
  searchError.value = ''
  addNotice.value = ''
  addError.value = ''
  isAddedWeatherMocked.value = false
  results.value = []

  try {
    const raw = await geocodeCity(query.value)
    results.value = raw.map((item) => ({
      ...item,
      region: item.countryCode === 'KR' ? 'domestic' : 'international',
    }))
    if (results.value.length === 0) {
      // Open-Meteo Geocoding API가 일부 도시(특히 국내 주요 도시)는 한글 표기로 잘
      // 안 잡히는 경우가 있어서(영문/로마자 표기로는 잡히는 경우가 많음) 안내를 덧붙인다.
      searchError.value = '검색 결과가 없습니다. 영문 표기로도 시도해 보세요 (예: Seoul, Busan).'
    }
  } catch (error) {
    searchError.value =
      error.status === 429
        ? '검색 요청이 너무 많습니다 (429 Too Many Requests). 잠시 후 다시 시도해 주세요.'
        : '위치 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isSearching.value = false
  }
}

async function onAdd(result) {
  if (isAdding.value) return

  isAdding.value = true
  addNotice.value = ''
  addError.value = ''
  isAddedWeatherMocked.value = false

  const duplicate = findDuplicateCity(result, customCityStore.cities)
  if (duplicate) {
    if (duplicate.region === props.region) {
      emit('select-existing', duplicate.id)
      emit('close')
    } else {
      addNotice.value = `이미 ${duplicate.region === 'domestic' ? '국내' : '해외'} 목록에 있는 도시입니다.`
    }
    isAdding.value = false
    return
  }

  try {
    const city = await customCityStore.addCity({
      name: result.name,
      lat: result.lat,
      lon: result.lon,
      region: result.region,
    })
    emit('added', city)

    // 지금 보고 있는 탭과 같은 지역이고 날씨도 정상 수신됐으면 바로 닫아도 결과가 눈에
    // 보이지만, 다른 지역이거나 날씨가 데모로 대체됐으면 모달만 조용히 닫혀서는 사용자가
    // 그 사실을 알 방법이 없다. 그런 경우엔 안내하고 모달을 열어둔 채로 직접 닫게 한다.
    if (city.region === props.region && !city.mocked) {
      emit('close')
    } else {
      const regionNote =
        city.region === props.region
          ? ''
          : `${city.region === 'domestic' ? '국내' : '해외'} 목록에 `
      const demoNote = city.mocked ? ` 날씨는 데모 데이터입니다 (${city.mockReason}).` : ''
      addNotice.value = `${withSubjectParticle(city.name)} ${regionNote}추가되었습니다.${demoNote}`
      isAddedWeatherMocked.value = city.mocked
      query.value = ''
      results.value = []
    }
  } catch {
    addError.value = '도시는 추가됐지만 날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isAdding.value = false
  }
}

function resultLabel(result) {
  const place = result.admin1 && result.admin1 !== result.name ? `${result.admin1}, ` : ''
  return `${place}${result.country}`
}
</script>

<template>
  <div class="city-modal-overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div class="city-modal" role="dialog" aria-modal="true" aria-label="도시 검색해서 추가">
      <div class="city-modal__header">
        <h3 class="city-modal__title"><i class="fa-solid fa-magnifying-glass-location"></i> 도시 검색</h3>
        <button type="button" class="city-modal__close-btn" aria-label="닫기" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="city-modal__field">
        <input
          v-model="query"
          type="text"
          placeholder="추가할 도시 이름 입력"
          @keyup.enter="onSearch"
        />
        <button type="button" class="city-modal__search-btn" :disabled="isSearching" @click="onSearch">
          <i v-if="isSearching" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-magnifying-glass"></i>
          검색
        </button>
      </div>

      <p v-if="searchError" class="city-modal__message is-error">{{ searchError }}</p>
      <p
        v-if="addNotice"
        class="city-modal__message"
        :class="isAddedWeatherMocked ? 'is-warning' : 'is-notice'"
      >
        {{ addNotice }}
      </p>
      <p v-if="addError" class="city-modal__message is-error">{{ addError }}</p>

      <ul v-if="results.length > 0" class="city-modal__results">
        <li v-for="(result, index) in results" :key="index" class="city-modal__result">
          <div class="city-modal__result-info">
            <p class="city-modal__result-name">{{ result.name }}</p>
            <p class="city-modal__result-detail">
              {{ resultLabel(result) }}
              <span class="city-modal__result-region">{{
                result.region === 'domestic' ? '국내' : '해외'
              }}</span>
            </p>
          </div>
          <button
            type="button"
            class="city-modal__add-btn"
            :disabled="isAdding"
            @click="onAdd(result)"
          >
            <i class="fa-solid fa-plus"></i> 추가
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.city-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.45);
}

.city-modal {
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px 22px;
  border-radius: var(--border-radius-large);
  background: var(--color-card-background);
  box-shadow: var(--shadow-hover);
}

.city-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.city-modal__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.city-modal__title i {
  color: var(--color-primary-darker);
}

.city-modal__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-light);
  cursor: pointer;
}

.city-modal__close-btn:hover {
  background: var(--color-primary-opacity-10);
  color: var(--color-text);
}

.city-modal__field {
  display: flex;
  gap: 8px;
}

.city-modal__field input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-opacity-10);
  font-size: 14px;
  color: var(--color-text);
}

.city-modal__field input:focus {
  outline: none;
  border-color: var(--color-primary-darker);
  background: var(--color-card-background);
}

.city-modal__search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-darker);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.city-modal__search-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.city-modal__message {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: var(--border-radius-medium);
  font-size: 13px;
  text-align: center;
}

.city-modal__message.is-error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.city-modal__message.is-notice {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.city-modal__message.is-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.city-modal__results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.city-modal__result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
}

.city-modal__result-info {
  min-width: 0;
}

.city-modal__result-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.city-modal__result-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.city-modal__result-region {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-primary-opacity-10);
  font-weight: 700;
}

.city-modal__add-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.city-modal__add-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}

.city-modal__add-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
