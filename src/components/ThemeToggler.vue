<script setup>
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)
const { toggleTheme } = themeStore
</script>

<template>
  <button
    type="button"
    class="theme-toggler"
    :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
    :title="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
    @click="toggleTheme"
  >
    <i class="fa-solid" :class="theme === 'dark' ? 'fa-sun' : 'fa-moon'"></i>
  </button>
</template>

<style scoped>
.theme-toggler {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.theme-toggler:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
