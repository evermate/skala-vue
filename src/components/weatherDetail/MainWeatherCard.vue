<script setup>
import { computed } from 'vue'
import { useDisplayTemp } from '@/composables/useDisplayTemp'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
  isDomestic: {
    type: Boolean,
    default: false,
  },
  customMemo: {
    type: String,
    default: '',
  },
})

const { unitSymbol, displayTemp } = useDisplayTemp(() => props.city.temp)
const { displayTemp: displayFeelsLike } = useDisplayTemp(() => props.city.feelsLike)

const regionLabel = computed(() => (props.isDomestic ? '대한민국 ' : ''))
</script>

<template>
  <div class="weather-detail__card">
    <p class="weather-detail__place">
      <i class="fa-solid fa-location-dot"></i> {{ regionLabel }}{{ city.name }}
    </p>
    <p v-if="customMemo" class="weather-detail__memo">
      <i class="fa-solid fa-note-sticky"></i> {{ customMemo }}
    </p>
    <dl class="weather-detail__list">
      <div class="weather-detail__row">
        <dt><i class="fa-solid fa-temperature-half"></i> 실시간 기온</dt>
        <dd>{{ displayTemp }}{{ unitSymbol }}</dd>
      </div>
      <div class="weather-detail__row">
        <dt><i class="fa-solid fa-temperature-three-quarters"></i> 체감 온도</dt>
        <dd>{{ displayFeelsLike }}{{ unitSymbol }}</dd>
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
</template>

<style scoped>
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

.weather-detail__memo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -8px 0 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
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
</style>
