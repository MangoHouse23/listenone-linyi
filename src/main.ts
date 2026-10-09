import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { usePlayer } from './stores/player'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// 播放器内核绑定（音频事件 + 系统媒体键）
usePlayer().bindAudio()

// PC 空格键播放/暂停
window.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement
  if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    usePlayer().toggle()
  }
})
