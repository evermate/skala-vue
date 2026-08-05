<script setup>
defineProps({
  airQuality: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="weather-detail__card">
    <p class="weather-detail__section-title">
      <i class="fa-solid fa-smog"></i> 미세먼지
      <span
        v-if="airQuality?.mocked"
        class="weather-detail__demo-badge"
        :title="airQuality.mockReason"
        >데모</span
      >
    </p>
    <p v-if="isLoading" class="weather-detail__section-empty">불러오는 중...</p>
    <dl v-else-if="airQuality" class="weather-detail__list">
      <div class="weather-detail__row">
        <dt>등급</dt>
        <dd>{{ airQuality.level }}</dd>
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
