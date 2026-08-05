<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import UnitToggler from './components/UnitToggler.vue'
import ThemeToggler from './components/ThemeToggler.vue'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <header class="app-nav">
    <div class="app-nav__row">
      <nav class="app-nav__links">
        <RouterLink to="/" class="app-nav__link">
          <i class="fa-solid fa-cloud-sun-rain"></i>
          <span class="app-nav__link-text">날씨 대시보드</span>
        </RouterLink>
        <RouterLink to="/journal" class="app-nav__link">
          <i class="fa-solid fa-book"></i>
          <span class="app-nav__link-text">날씨 일지</span>
        </RouterLink>
        <RouterLink to="/about" class="app-nav__link">
          <i class="fa-solid fa-circle-info"></i>
          <span class="app-nav__link-text">서비스 소개</span>
        </RouterLink>
      </nav>
      <div class="app-nav__actions">
        <ThemeToggler />
        <UnitToggler />
        <div v-if="authStore.isLoggedIn" class="app-nav__user">
          <span class="app-nav__user-name">{{ authStore.user.name }}님</span>
          <button
            type="button"
            class="app-nav__logout-btn"
            title="로그아웃"
            aria-label="로그아웃"
            @click="logout"
          >
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
        <RouterLink v-else to="/login" class="app-nav__link">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span class="app-nav__link-text">로그인</span>
        </RouterLink>
      </div>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
.app-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color-default);
  background: color-mix(in srgb, var(--color-card-background) 85%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.app-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
}

.app-nav__links {
  display: flex;
  gap: 4px;
}

.app-nav__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.app-nav__user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.app-nav__user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.app-nav__logout-btn {
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

.app-nav__logout-btn:hover {
  background: var(--color-error);
  border-color: var(--color-error);
  color: #ffffff;
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

@media (max-width: 520px) {
  .app-nav__row {
    padding: 0 10px;
    gap: 6px;
  }

  .app-nav__links {
    gap: 2px;
  }

  .app-nav__link {
    padding: 8px 10px;
  }

  .app-nav__link-text {
    display: none;
  }

  .app-nav__user-name {
    display: none;
  }
}
</style>
