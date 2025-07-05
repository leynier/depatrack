import { createRouter, createWebHistory } from 'vue-router'
const HomeView = () => import('../views/HomeView.vue');
const AuthActionView = () => import('../views/auth/AuthActionView.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth/action',
      name: 'auth-action',
      component: AuthActionView,
    },
  ],
})

export default router