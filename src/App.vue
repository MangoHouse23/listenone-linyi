<script setup lang="ts">
import { ref } from 'vue'
import SideNav from './components/SideNav.vue'
import TabBar from './components/TabBar.vue'
import MiniPlayer from './components/MiniPlayer.vue'
import FullPlayer from './components/FullPlayer.vue'
import Toasts from './components/Toasts.vue'
import { usePlayer } from './stores/player'

const player = usePlayer()
const showFull = ref(false)
</script>

<template>
  <div class="shell">
    <SideNav class="pc" />

    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <div class="bottom-stack">
      <FullPlayer v-if="showFull" @close="showFull = false" />
      <MiniPlayer v-if="player.current && !showFull" @expand="showFull = true" />
      <TabBar class="h5" />
    </div>

    <Toasts />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: 248px 1fr;
}

.content {
  overflow-y: auto;
  padding: 34px clamp(22px, 4vw, 46px) 130px;
  max-width: 1080px;
  width: 100%;
  margin: 0 auto;
}

.bottom-stack {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100%;
  z-index: 800;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}
.bottom-stack > :deep(*) {
  pointer-events: auto;
}

@media (max-width: 860px) {
  .shell {
    grid-template-columns: 1fr;
  }
  .content {
    padding: 22px 18px 150px;
  }
}

/* PC / H5 可见性 */
@media (min-width: 861px) {
  .h5 {
    display: none;
  }
}
@media (max-width: 860px) {
  .pc {
    display: none;
  }
}
</style>
