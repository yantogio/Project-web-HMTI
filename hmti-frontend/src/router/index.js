import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. Halaman Public (Landing Page)
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue') 
    },

    // 2. Halaman Login
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue') 
    },

    // 3. Area Admin (Management) - Membutuhkan Login
    {
      path: '/admin',
      name: 'admin-layout',
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-home',
          component: () => import('../views/AdminHome.vue') // Tabel anggota yang kita buat
        },
        {
          path: 'members',
          name: 'admin-members',
          component: () => import('../views/Anggota.vue') // Tabel anggota yang kita buat
        },
        {
          path: 'finance',
          name: 'admin-finance',
          component: () => import('../views/FinanceView.vue')
        },
        {
          path: 'docs',
          name: 'admin-docs',
          component: () => import('../views/DocsView.vue')
        },
        {
          path: '/admin/showcase',
          name: 'ShowcaseHub',
          component: () => import('../views/ShowcaseHub.vue') // Sesuaikan path foldernya
        },
        {
          path: '/admin/profile',
          name: 'Profile',
          component: () => import('../views/Profile.vue') // Sesuaikan path foldernya
        }
      ]
    }
  ]
})

// Guard: Cek apakah route butuh login
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Kalau butuh login (meta.requiresAuth) tapi belum login -> tendang ke /login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }

  next()
})

export default router