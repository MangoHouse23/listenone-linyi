import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'discover', component: () => import('./views/DiscoverView.vue') },
    { path: '/search', name: 'search', component: () => import('./views/SearchView.vue') },
    { path: '/charts', name: 'charts', component: () => import('./views/ChartsView.vue') },
    { path: '/playlist/:id', name: 'playlist', component: () => import('./views/PlaylistView.vue') },
    { path: '/fm', name: 'fm', component: () => import('./views/FMView.vue') },
    { path: '/library', name: 'library', component: () => import('./views/LibraryView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
