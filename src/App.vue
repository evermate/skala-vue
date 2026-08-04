<script setup>
import { RouterLink, RouterView } from 'vue-router'
import UnitToggler from './components/UnitToggler.vue'
</script>

<template>
  <header class="app-nav">
    <div class="app-nav__row">
      <nav class="app-nav__links">
        <RouterLink to="/" class="app-nav__link">
          <i class="fa-solid fa-cloud-sun-rain"></i> 날씨 대시보드
        </RouterLink>
        <RouterLink to="/about" class="app-nav__link">
          <i class="fa-solid fa-circle-info"></i> 서비스 소개
        </RouterLink>
      </nav>
      <UnitToggler />
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
.app-nav {
  border-bottom: 1px solid var(--border-color-default);
  background: var(--color-card-background);
}

.app-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 16px;
}

.app-nav__links {
  display: flex;
  gap: 4px;
}

.app-nav__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--border-radius-medium);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.app-nav__link:hover {
  background: var(--color-primary-opacity-10);
  color: var(--color-text);
}

.app-nav__link.router-link-active {
  background: var(--color-primary-darker);
  color: #ffffff;
}
</style>
