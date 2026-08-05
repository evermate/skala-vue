import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'weather-home',
      component: () => import('@/views/WeatherHomeView.vue'),
    },
    {
      path: '/about',
      name: 'weather-about',
      component: () => import('@/views/WeatherAboutView.vue'),
    },
    {
      path: '/journal',
      name: 'weather-journal',
      component: () => import('@/views/WeatherJournalView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('@/views/WeatherDetailView.vue'),
    },
    {
      path: '/ladder',
      name: 'ladder-game',
      component: () => import('@/views/LadderGameView.vue'),
    },
    // 이 catch-all은 항상 마지막에 와야 한다. 위로 옮기면 그 아래 모든 라우트가
    // 매칭되기 전에 여기 걸려서 조용히 404로 빠진다.
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
