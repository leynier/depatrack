import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize Analytics after router is ready
router.isReady().then(() => {
  // Import analytics composable dynamically to avoid SSR issues
  import('./composables/useAnalytics').then(({ useAnalytics }) => {
    const { initializeRouteTracking } = useAnalytics()
    initializeRouteTracking()
  })
})

app.mount('#app')
