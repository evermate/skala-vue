import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

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
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('@/views/WeatherDetailView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if ((to.name === 'login' || to.name === 'signup') && authStore.isLoggedIn) {
    return { name: 'weather-journal' }
  }
})

export default router
