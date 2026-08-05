<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const FEATURES = [
  { icon: 'fa-cloud-sun', title: '실시간 날씨', desc: '국내 22개·해외 14개 도시의 실시간 기온과 날씨 현황' },
  { icon: 'fa-map-location-dot', title: '지도 연동', desc: '도시 위치와 날씨를 지도에서 함께 확인' },
  { icon: 'fa-magnifying-glass', title: '검색·필터', desc: '도시명 검색과 날씨 상태 필터로 빠르게 찾기' },
  { icon: 'fa-location-crosshairs', title: '현재 위치', desc: '지금 있는 곳의 날씨를 바로 확인' },
  { icon: 'fa-square-plus', title: '도시 추가', desc: '목록에 없는 도시는 검색해서 추가하고 메모도 남기기' },
  { icon: 'fa-circle-info', title: '상세 정보', desc: '체감온도·습도·풍속·미세먼지·5일 예보' },
  { icon: 'fa-book', title: '날씨 일지', desc: '다녀온 곳의 날씨를 기록하고 다시 찾아보기' },
  { icon: 'fa-temperature-half', title: '단위 전환', desc: '섭씨/화씨 전환, 다음 방문에도 유지' },
]

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="weather-about">
    <div class="weather-about__header">
      <button class="weather-about__back-btn" @click="goHome">
        <i class="fa-solid fa-arrow-left"></i> 뒤로가기
      </button>
      <h2 class="weather-about__title"><i class="fa-solid fa-circle-info"></i> 서비스 소개</h2>
    </div>

    <p class="weather-about__lead">
      국내외 날씨를 확인하고, 원하는 도시를 직접 추가해서 관리하는 날씨 대시보드입니다.
    </p>

    <ul class="weather-about__grid">
      <li v-for="feature in FEATURES" :key="feature.title" class="weather-about__feature">
        <i class="fa-solid weather-about__feature-icon" :class="feature.icon"></i>
        <p class="weather-about__feature-title">{{ feature.title }}</p>
        <p class="weather-about__feature-desc">{{ feature.desc }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.weather-about {
  max-width: 760px;
  margin: 32px auto;
  padding: 0 16px;
}

.weather-about__header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin: 0 0 12px;
}

.weather-about__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-about__back-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}

.weather-about__title {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: center;
  margin: 0;
  font-size: 20px;
  color: var(--color-text);
}

.weather-about__title i {
  color: var(--color-primary-darker);
}

.weather-about__lead {
  margin: 0 0 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.weather-about__grid {
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.weather-about__feature {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 16px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  background: var(--color-card-background);
  box-shadow: var(--shadow-card);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.weather-about__feature:hover {
  border-color: var(--color-primary-darker);
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}

.weather-about__feature-icon {
  font-size: 20px;
  color: var(--color-primary-darker);
}

.weather-about__feature-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text);
}

.weather-about__feature-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
</style>
