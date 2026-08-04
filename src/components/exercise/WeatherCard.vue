<script setup>
import { computed } from 'vue'

const props = defineProps({
  city: {
    type: Object,
    required: true,
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

    <button class="weather-card__detail-btn" @click.stop="emit('click-detail', city.id)">
      <i class="fa-solid fa-circle-info"></i> 상세보기
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
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.weather-card:hover {
  border-color: var(--color-primary-darker);
  box-shadow: var(--shadow-hover);
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
  color: var(--color-primary);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.weather-card__name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-card__status {
  font-weight: 400;
  color: var(--color-text-secondary);
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
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-card__temp-block.is-warm {
  color: var(--color-warm);
}

.weather-card__temp-block.is-cool {
  color: var(--color-info);
}

.weather-card__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-small);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-card__detail-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
