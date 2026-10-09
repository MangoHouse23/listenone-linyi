<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CHARTS, getPlaylistDetail, type PlaylistDetail } from '../api/listen1'
import PlaylistCard from '../components/PlaylistCard.vue'
import { usePlayer } from '../stores/player'
import { getDailyTracks } from '../composables/pools'
import { toast } from '../utils/emitter'

const router = useRouter()
const player = usePlayer()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const dateLine = computed(() => {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${week}`
})

const dailyLoading = ref(false)
async function playDaily() {
  if (dailyLoading.value) return
  dailyLoading.value = true
  try {
    const tracks = await getDailyTracks()
    player.playQueue(tracks, 0)
    toast('每日 30 首已就绪，开始聆听吧', 'ok')
  } catch {
    toast('每日推荐加载失败，请稍后再试', 'error')
  } finally {
    dailyLoading.value = false
  }
}

const featured = ref<(PlaylistDetail & { tint: string })[]>([])

onMounted(async () => {
  try {
    const details = await Promise.all(
      CHARTS.map(async (c) => {
        const d = await getPlaylistDetail(c.id)
        return { ...d, tint: c.tint }
      }),
    )
    featured.value = details
  } catch {
    /* 静默：卡片显示渐变兜底 */
  }
})
</script>

<template>
  <div class="discover">
    <!-- 问候 + 每日推荐 -->
    <section class="hero stagger">
      <div class="hello">
        <h1>{{ greeting }}，<br class="h5-br" />今天想听点什么？</h1>
        <p>{{ dateLine }} · 聚合多平台曲库，一个好用的入口就够了</p>
      </div>

      <button class="daily card" :disabled="dailyLoading" @click="playDaily">
        <div class="daily-art" aria-hidden="true">
          <span class="a" /><span class="b" /><span class="c" />
        </div>
        <div class="daily-text">
          <p class="tag">每日推荐 · DAILY 30</p>
          <p class="title">根据全网热歌，每天换一份新心情</p>
          <p class="cta">{{ dailyLoading ? '正在为你挑选…' : '立即聆听 →' }}</p>
        </div>
      </button>
    </section>

    <!-- 排行榜速览 -->
    <section class="block">
      <div class="head">
        <h2 class="section-title">排行榜 <small>CHARTS</small></h2>
        <RouterLink to="/charts" class="more">全部榜单 →</RouterLink>
      </div>
      <div class="chart-grid stagger">
        <button v-for="c in CHARTS.slice(0, 4)" :key="c.id" class="chart-card card" :style="{ '--tint': c.tint }" @click="router.push(`/playlist/${c.id}`)">
          <i class="stripe" />
          <p class="c-name">{{ c.name }}</p>
          <p class="c-desc">{{ c.desc }}</p>
          <span class="c-go">查看 →</span>
        </button>
      </div>
    </section>

    <!-- 精选歌单 -->
    <section class="block">
      <div class="head">
        <h2 class="section-title">精选歌单 <small>PLAYLISTS</small></h2>
      </div>
      <div class="pl-grid stagger">
        <PlaylistCard
          v-for="p in featured"
          :key="p.id"
          :name="p.name"
          :cover="p.cover"
          :count="p.count"
          :tint="p.tint"
          @click="router.push(`/playlist/${p.id}`)"
        />
        <template v-if="!featured.length">
          <div v-for="i in 6" :key="i" class="skeleton pl-sk" />
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 22px;
  align-items: stretch;
  margin-bottom: 40px;
}
.hero > * {
  animation-delay: calc(var(--i, 0) * 60ms);
}

.hello {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.hello h1 {
  font-family: var(--font-display);
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.3;
  color: var(--ink);
}
.hello p {
  margin-top: 12px;
  color: var(--ink-3);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.daily {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 26px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  background: linear-gradient(135deg, #0c5340, #147c5a 70%, #1e9168);
  color: #f2efe4;
  border: none;
  box-shadow: 0 14px 34px rgba(12, 83, 64, 0.32);
}
.daily:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 44px rgba(12, 83, 64, 0.4);
}
.daily:disabled {
  opacity: 0.85;
}

.daily-art {
  position: relative;
  width: 86px;
  height: 86px;
  flex: none;
}
.daily-art span {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(242, 239, 228, 0.35);
}
.daily-art .a {
  inset: 0;
  border-style: dashed;
  animation: spin 22s linear infinite;
}
.daily-art .b {
  inset: 18%;
  border-color: rgba(242, 239, 228, 0.55);
  animation: spin 14s linear infinite reverse;
}
.daily-art .c {
  inset: 34%;
  background: var(--coral);
  border: none;
  box-shadow: 0 0 22px rgba(255, 107, 74, 0.65);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tag {
  font-size: 10px;
  letter-spacing: 0.3em;
  opacity: 0.75;
  margin-bottom: 7px;
}
.daily .title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.5;
}
.daily .cta {
  margin-top: 10px;
  font-size: 12.5px;
  letter-spacing: 0.1em;
  opacity: 0.9;
}

.block {
  margin-bottom: 40px;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
}
.more {
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
  transition: color 0.2s ease;
}
.more:hover {
  color: var(--jade-deep);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.chart-grid > *:nth-child(1) { animation-delay: 0ms; }
.chart-grid > *:nth-child(2) { animation-delay: 70ms; }
.chart-grid > *:nth-child(3) { animation-delay: 140ms; }
.chart-grid > *:nth-child(4) { animation-delay: 210ms; }

.chart-card {
  position: relative;
  overflow: hidden;
  padding: 18px 18px 16px;
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2);
}
.stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--tint), color-mix(in srgb, var(--tint) 40%, #fff));
}
.c-name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--ink);
  margin-bottom: 5px;
}
.c-desc {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
  min-height: 2.4em;
}
.c-go {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--tint);
  letter-spacing: 0.1em;
  font-weight: 600;
}

.pl-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
}
.pl-grid > *:nth-child(1) { animation-delay: 0ms; }
.pl-grid > *:nth-child(2) { animation-delay: 60ms; }
.pl-grid > *:nth-child(3) { animation-delay: 120ms; }
.pl-grid > *:nth-child(4) { animation-delay: 180ms; }
.pl-grid > *:nth-child(5) { animation-delay: 240ms; }
.pl-grid > *:nth-child(6) { animation-delay: 300ms; }

.pl-sk {
  aspect-ratio: 1;
  border-radius: 14px;
}

.h5-br {
  display: none;
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }
  .h5-br {
    display: block;
  }
  .chart-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .pl-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .block {
    margin-bottom: 28px;
  }
}
</style>
