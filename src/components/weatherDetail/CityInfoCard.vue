<script setup>
import { computed } from 'vue'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

const props = defineProps({
  info: {
    type: Object,
    default: null,
  },
  timezone: {
    type: String,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// 스냅샷 표시라 페이지에 머무는 동안 값이 갱신되진 않는다 — 새로고침/재진입 시에만 다시 계산됨.
const localTimeLabel = computed(() => {
  if (!props.timezone) return ''
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: props.timezone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
  } catch {
    return ''
  }
})
</script>

<template>
  <BaseDashboardCard icon="fa-solid fa-book" title="도시 정보">
    <template v-if="localTimeLabel" #title-extra>
      <span class="city-info__local-time"><i class="fa-solid fa-clock"></i> {{ localTimeLabel }}</span>
    </template>

    <p v-if="isLoading" class="weather-detail__section-empty">불러오는 중...</p>
    <div v-else-if="info" class="city-info">
      <img
        v-if="info.thumbnailUrl"
        :src="info.thumbnailUrl"
        :alt="info.title"
        class="city-info__photo"
      />
      <p v-if="info.description" class="city-info__desc">{{ info.description }}</p>
      <p v-if="info.extract" class="city-info__extract">{{ info.extract }}</p>
      <a
        v-if="info.pageUrl"
        :href="info.pageUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="city-info__link"
      >
        위키백과에서 더 보기 <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
    </div>
    <p v-else class="weather-detail__section-empty">도시 정보를 불러오지 못했습니다.</p>
  </BaseDashboardCard>
</template>

<style scoped>
.weather-detail__section-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
}

.city-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.city-info__photo {
  width: 100%;
  height: 280px;
  border-radius: var(--border-radius-medium);
  object-fit: cover;
}

.city-info__desc {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.city-info__extract {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.city-info__link {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary-darker);
  text-decoration: none;
}

.city-info__link:hover {
  text-decoration: underline;
}

.city-info__local-time {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-primary-opacity-10);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
