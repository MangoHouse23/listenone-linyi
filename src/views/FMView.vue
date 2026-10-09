<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getFmPool } from '../composables/pools'
import { usePlayer } from '../stores/player'
import { useLibrary, trackKey } from '../stores/library'
import { useCover } from '../composables/cover'
import { toast } from '../utils/emitter'

const player = usePlayer()
const library = useLibrary()

const ready = ref(false)
const cover = useCover(() => player.current, 600)

onMounted(async () => {
  try {
    if (!player.current) {
      const pool = await getFmPool()
      player.queue = pool
      player.index = Math.floor(Math.random() * Math.min(10, pool.length))
      await player.loadAndPlay()
    }
  } finally {
    ready.value = true
  }
})

const isCurrentFav = computed(() => {
  const c = player.current
  return !!c && library.isFav(c)
})

function toggleFav() {
  if (!player.current) return
  const added = library.toggleFav(player.current)
  toast(added ? '已收藏到我喜欢的音乐' : '已取消收藏', added ? 'ok' : 'info')
}

function skip() {
  player.next()
}

function loveAndSkip() {
  if (player.current) library.toggleFav(player.current)
  skip()
}

const currentKey = computed(() => (player.current ? trackKey(player.current) : ''))
</script>

<template>
  <div class="fm">
    <header class="page-head">
      <h1>私人 FM</h1>
      <p>从全网热歌与飙升金曲中，为你连续放电</p>
    </header>

    <div v-if="!ready && !player.current" class="empty-hint">正在调频…</div>

    <Transition name="cardflip" mode="out-in">
      <section v-if="player.current" :key="currentKey" class="stage">
        <div class="art-wrap">
          <div class="halo" :style="{ backgroundImage: cover ? `url(${cover})` : 'none' }" />
          <div class="art card">
            <img v-if="cover" :src="cover" alt="" />
            <div v-else class="ph"><span>♪</span></div>
          </div>
          <span class="stamp">FM</span>
        </div>

        <div class="info">
          <h2>{{ player.current.name }}</h2>
          <p class="artist">{{ player.current.artist.join(' / ') }}<template v-if="player.current.album"> — {{ player.current.album }}</template></p>
        </div>

        <div class="ops">
          <button class="op ghost" title="收藏" @click="toggleFav">
            <svg viewBox="0 0 24 24" :fill="isCurrentFav ? 'var(--coral)' : 'none'" :stroke="isCurrentFav ? 'var(--coral)' : 'currentColor'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.5 12 20.5Z" />
            </svg>
            <span>喜欢</span>
          </button>
          <button class="op primary" @click="skip">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5v14l10.5-7z" /></svg>
            <span>换一首</span>
          </button>
          <button class="op ghost danger" title="不喜欢，跳过" @click="loveAndSkip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14h4l4 5v-15l-4 5H4zM19 5 5 19" transform="scale(-1,1) translate(-24,0)" />
            </svg>
            <span>不想听</span>
          </button>
        </div>

        <p class="hint">点封面进入全屏 · 空格键播放 / 暂停</p>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 30px;
  text-align: center;
}
.page-head h1 {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0.14em;
}
.page-head p {
  margin-top: 7px;
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.art-wrap {
  position: relative;
  width: min(320px, 68vw);
  aspect-ratio: 1;
}
.halo {
  position: absolute;
  inset: -14%;
  background-size: cover;
  background-position: center;
  filter: blur(56px) saturate(1.3) brightness(1.05);
  opacity: 0.55;
  border-radius: 40%;
}
.art {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: var(--shadow-2);
  cursor: pointer;
  transition: transform 0.3s ease;
}
.art:hover {
  transform: scale(1.015) rotate(0.5deg);
}
.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(140deg, var(--jade), var(--jade-deep));
}
.ph span {
  font-family: var(--font-display);
  font-size: 64px;
  color: rgba(255, 255, 255, 0.9);
}
.stamp {
  position: absolute;
  top: -12px;
  right: -14px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.2em;
  color: #fff;
  background: var(--coral);
  padding: 7px 13px;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(255, 107, 74, 0.4);
  transform: rotate(6deg);
}

.info {
  margin-top: 26px;
  text-align: center;
  min-width: 0;
  max-width: 90%;
}
.info h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.artist {
  margin-top: 7px;
  font-size: 13.5px;
  color: var(--ink-3);
  letter-spacing: 0.05em;
}

.ops {
  margin-top: 26px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.op {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 12px 22px;
  font-size: 14px;
  letter-spacing: 0.06em;
  transition: all 0.2s ease;
}
.op svg {
  width: 18px;
  height: 18px;
}
.op.ghost {
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink-2);
}
.op.ghost:hover {
  border-color: var(--jade);
  color: var(--jade-deep);
}
.op.ghost.danger:hover {
  border-color: var(--coral);
  color: #c2431f;
}
.op.primary {
  background: var(--jade-deep);
  color: #f4f1e8;
  font-weight: 600;
  box-shadow: 0 8px 22px rgba(12, 83, 64, 0.32);
}
.op.primary:hover {
  background: var(--jade);
  transform: translateY(-2px);
}

.hint {
  margin-top: 30px;
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
}

.cardflip-enter-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.cardflip-leave-active {
  transition: all 0.25s ease;
}
.cardflip-enter-from {
  opacity: 0;
  transform: translateY(22px) scale(0.97);
}
.cardflip-leave-to {
  opacity: 0;
  transform: translateY(-14px) scale(0.98);
}
</style>
