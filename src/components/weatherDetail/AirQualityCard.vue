<script setup>
import { computed } from 'vue'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

const props = defineProps({
  airQuality: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const LEVEL_CLASS = {
  좋음: 'is-good',
  보통: 'is-moderate',
  나쁨: 'is-bad',
  '매우 나쁨': 'is-severe',
}

const levelClass = computed(() => LEVEL_CLASS[props.airQuality?.level] ?? '')
</script>

<template>
  <BaseDashboardCard icon="fa-solid fa-smog" title="미세먼지">
    <template v-if="airQuality?.mocked" #title-badge>
      <el-tag type="warning" size="small" :title="airQuality.mockReason">데모</el-tag>
    </template>

    <el-skeleton v-if="isLoading" :rows="3" animated />
    <dl v-else-if="airQuality" class="weather-detail__list">
      <div class="weather-detail__row">
        <dt>등급</dt>
        <dd class="weather-detail__aqi-level" :class="levelClass">{{ airQuality.level }}</dd>
      </div>
      <div class="weather-detail__row">
        <dt>미세먼지 (PM10)</dt>
        <dd>{{ airQuality.pm10 }}µg/m³</dd>
      </div>
      <div class="weather-detail__row">
        <dt>초미세먼지 (PM2.5)</dt>
        <dd>{{ airQuality.pm2_5 }}µg/m³</dd>
      </div>
    </dl>
    <p v-else class="weather-detail__section-empty">미세먼지 정보를 불러오지 못했습니다.</p>
  </BaseDashboardCard>
</template>

<style scoped>
.weather-detail__section-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
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

.weather-detail__aqi-level.is-good {
  color: var(--color-success);
}

.weather-detail__aqi-level.is-moderate {
  color: var(--color-info);
}

.weather-detail__aqi-level.is-bad {
  color: var(--color-warning);
}

.weather-detail__aqi-level.is-severe {
  color: var(--color-error);
}
</style>
