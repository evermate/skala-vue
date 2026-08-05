<script setup>
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
  <div class="weather-detail__card">
    <p class="weather-detail__section-title">
      <i class="fa-solid fa-calendar-days"></i> 5일 예보
      <span v-if="mocked" class="weather-detail__demo-badge" :title="mockReason">데모</span>
    </p>
    <p v-if="isLoading" class="weather-detail__section-empty">불러오는 중...</p>
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

.weather-detail__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.weather-detail__section-title i {
  color: var(--color-primary-darker);
}

.weather-detail__demo-badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--color-warning);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
}

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
