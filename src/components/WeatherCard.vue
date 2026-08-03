<script setup>
import { computed } from 'vue'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

const isWarm = computed(() => props.city.temp >= 25)
</script>

<template>
  <li class="weather-card" @click="emit('select-card', city.id)">
    <div class="weather-card__header">
      <div class="weather-card__info">
        <i class="weather-card__icon" :class="city.icon"></i>
        <p class="weather-card__name">
          {{ city.name }} <span class="weather-card__status">({{ city.status }})</span>
        </p>
      </div>

      <div class="weather-card__temp-block" :class="isWarm ? 'is-warm' : 'is-cool'">
        <span class="weather-card__temp-value">{{ city.temp }}°</span>
        <span class="weather-card__temp-label">{{
          isWarm ? '더움 (25도 이상)' : '선선함 (25도 미만)'
        }}</span>
      </div>
    </div>

    <Transition name="detail">
      <dl v-if="isExpanded" class="weather-card__detail">
        <div class="weather-card__detail-row">
          <dt><i class="fa-solid fa-temperature-half"></i> 체감 온도</dt>
          <dd>{{ city.feelsLike }}°C</dd>
        </div>
        <div class="weather-card__detail-row">
          <dt><i class="fa-solid fa-droplet"></i> 습도</dt>
          <dd>{{ city.humidity }}%</dd>
        </div>
        <div class="weather-card__detail-row">
          <dt><i class="fa-solid fa-wind"></i> 풍속</dt>
          <dd>{{ city.windSpeed }}km/h</dd>
        </div>
      </dl>
    </Transition>

    <button
      class="weather-card__detail-btn"
      :class="{ 'is-active': isExpanded }"
      @click.stop="emit('click-detail', city.id)"
    >
      <i class="fa-solid" :class="isExpanded ? 'fa-chevron-up' : 'fa-circle-info'"></i>
      {{ isExpanded ? '접기' : '상세보기' }}
    </button>
  </li>
</template>

<style scoped>
.weather-card {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.weather-card:hover {
  border-color: var(--aurora-1);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.weather-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.weather-card__info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.weather-card__icon {
  font-size: 20px;
  color: var(--aurora-2);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.weather-card__name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-card__status {
  font-weight: 400;
  color: var(--text-dim);
}

.weather-card__temp-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  line-height: 1;
}

.weather-card__temp-value {
  font-size: 30px;
  font-weight: 800;
}

.weather-card__temp-label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dim);
  white-space: nowrap;
}

.weather-card__temp-block.is-warm {
  color: var(--warm-text);
}

.weather-card__temp-block.is-cool {
  color: var(--cool-text);
}

.weather-card__detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 10px 12px;
  background: var(--surface-muted);
  border-radius: var(--radius-sm);
}

.weather-card__detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.weather-card__detail-row dt {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-dim);
}

.weather-card__detail-row dt i {
  width: 14px;
  color: var(--aurora-1);
}

.weather-card__detail-row dd {
  margin: 0;
  font-weight: 700;
  color: var(--text);
}

.detail-enter-active,
.detail-leave-active {
  transition:
    opacity 0.15s ease,
    max-height 0.2s ease;
  overflow: hidden;
}

.detail-enter-from,
.detail-leave-to {
  opacity: 0;
  max-height: 0;
}

.detail-enter-to,
.detail-leave-from {
  opacity: 1;
  max-height: 120px;
}

.weather-card__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-card__detail-btn:hover,
.weather-card__detail-btn.is-active {
  background: var(--aurora-1);
  border-color: var(--aurora-1);
  color: #ffffff;
}
</style>
