<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CHARTS, getPlaylistDetail, type PlaylistDetail } from '../api/listen1'
import { usePlayer } from '../stores/player'
import { toast } from '../utils/emitter'

const router = useRouter()
const player = usePlayer()

const details = ref<(PlaylistDetail | null)[]>(CHARTS.map(() => null))
let alive = true

onMounted(async () => {
  // 榜单封面懒加载：先到先用，避免首屏卡顿
  await Promise.all(
    CHARTS.map(async (c, i) => {
      try {
        const d = await getPlaylistDetail(c.id)
        if (alive) details.value[i] = d
      } catch {
        /* 卡片降级为渐变 */
      }
    }),
  )
})

onBeforeUnmount(() => {
  alive = false
})

async function quickPlay(i: number) {
  const d = details.value[i]
  if (!d || !d.tracks.length) {
    toast('榜单加载中，请稍候', 'info')
    return
  }
  player.playQueue(d.tracks, 0)
  toast(`正在播放「${CHARTS[i].name}」`, 'ok')
}
</script>

<template>
  <div class="charts">
    <header class="page-head">
      <h1>排行榜</h1>
      <p>官方榜单每日更新 · 点击封面直接开播</p>
    </header>

    <div class="grid stagger">
      <section v-for="(c, i) in CHARTS" :key="c.id" class="rank-card card" :style="{ '--tint': c.tint }">
        <div class="cover" @click="router.push(`/playlist/${c.id}`)">
          <img v-if="details[i]?.cover" :src="details[i]!.cover" :alt="c.name" loading="lazy" />
          <div v-else class="ph skeleton">
            <span>♪</span>
          </div>
          <button class="play-fab" title="播放全部" @click.stop="quickPlay(i)">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          </button>
        </div>
        <div class="body">
          <h2>{{ c.name }}</h2>
          <p>{{ c.desc }}</p>
          <div class="foot">
            <span>{{ details[i] ? `${details[i]!.count} 首` : '加载中…' }}</span>
            <button class="link" @click="router.push(`/playlist/${c.id}`)">查看完整榜单 →</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 26px;
}
.page-head h1 {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.page-head p {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.grid > *:nth-child(3n + 1) { animation-delay: 0ms; }
.grid > *:nth-child(3n + 2) { animation-delay: 80ms; }
.grid > *:nth-child(3n) { animation-delay: 160ms; }

.rank-card {
  overflow: hidden;
  border-radius: var(--radius-lg);
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}
.rank-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-2);
}

.cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(140deg, color-mix(in srgb, var(--tint) 85%, #fff), color-mix(in srgb, var(--tint) 45%, #f4f1e8));
  cursor: pointer;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.rank-card:hover .cover img {
  transform: scale(1.04);
}
.ph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 46px;
  color: rgba(255, 255, 255, 0.85);
  border-radius: 0;
}

.play-fab {
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.94);
  color: var(--jade-deep);
  display: grid;
  place-items: center;
  box-shadow: 0 8px 20px rgba(20, 20, 16, 0.25);
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.22s ease;
}
.rank-card:hover .play-fab {
  opacity: 1;
  transform: translateY(0);
}
.play-fab:hover {
  background: var(--jade-deep);
  color: #fff;
}
.play-fab svg {
  width: 21px;
  height: 21px;
}

.body {
  padding: 15px 18px 16px;
}
.body h2 {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.body p {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ink-3);
}
.foot {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ink-3);
}
.link {
  color: var(--tint);
  font-weight: 600;
  letter-spacing: 0.04em;
}
.link:hover {
  text-decoration: underline;
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .play-fab {
    opacity: 1;
    transform: none;
  }
}
</style>
