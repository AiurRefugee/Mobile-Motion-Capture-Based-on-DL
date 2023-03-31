import { createApp } from 'vue'
import mc from './mc.vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

import Varlet from '@varlet/ui'
import '@varlet/ui/es/style'

const app = createApp(App)

app.use(Varlet)

app.mount('#app')
