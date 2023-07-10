import { createRouter, createWebHistory } from 'vue-router'
import mc from '../mc.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'app',
      component: () => import('../App.vue')
    },
    {
      path: '/mc',
      name: 'mc',
      component: mc,
      hidden: true
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../mc.vue')
    }
  ]
})

export default router
