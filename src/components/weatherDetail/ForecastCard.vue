<script setup>
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

defineProps({
  forecast: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  mocked: {
    type: Boolean,
    default: false,
  },
  mockReason: {
    type: String,
    default: '',
  },
})

function formatForecastDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`
}
</script>

<template>
  <BaseDashboardCard icon="fa-solid fa-calendar-days" title="5일 예보">
    <template v-if="mocked" #title-badge>
      <el-tag type="warning" size="small" :title="mockReason">데모</el-tag>
    </template>

    <el-skeleton v-if="isLoading" :rows="2" animated />
    <ul v-else-if="forecast.length > 0" class="weather-detail__forecast">
      <li v-for="day in forecast" :key="day.date" class="weather-detail__forecast-day">
        <span class="weather-detail__forecast-date">{{ formatForecastDate(day.date) }}</span>
        <i class="fa-solid" :class="day.icon"></i>
        <span class="weather-detail__forecast-temps">
          <strong>{{ day.tempMax }}°</strong> / {{ day.tempMin }}°
        </span>
      </li>
    </ul>
    <p v-else class="weather-detail__section-empty">예보 정보를 불러오지 못했습니다.</p>
  </BaseDashboardCard>
</template>

<style scoped>
.weather-detail__section-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
}

.weather-detail__forecast {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}

.weather-detail__forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 64px;
  padding: 10px 6px;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-opacity-10);
}

.weather-detail__forecast-date {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-detail__forecast-day i {
  font-size: 16px;
  color: var(--color-primary-darker);
}

.weather-detail__forecast-temps {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-detail__forecast-temps strong {
  color: var(--color-text);
}
</style>
