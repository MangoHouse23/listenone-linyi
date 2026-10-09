<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { usePlayer } from '../stores/player'
import { useLibrary, trackKey } from '../stores/library'
import { useCover } from '../composables/cover'
import { sourceLabel } from '../api/listen1'
import { toast } from '../utils/emitter'

const emit = defineEmits<{ close: [] }>()

const player = usePlayer()
const library = useLibrary()

const cover = useCover(() => player.current, 600)
const showLyric = ref(false)
const showQueue = ref(false)

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/* 歌词高亮与滚动 */
const activeIdx = computed(() => {
  const t = player.currentTime
  let idx = -1
  for (let i = 0; i < player.lyric.length; i++) {
    if (player.lyric[i].t <= t + 0.2) idx = i
    else break
  }
  return idx
})

const lyricBox = ref<HTMLElement | null>(null)

watch(activeIdx, async () => {
  if (!showLyric.value) return
  await nextTick()
  const box = lyricBox.value
  const el = box?.querySelector('.line.active') as HTMLElement | null
  if (box && el) {
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' })
  }
})

watch(showLyric, async (v) => {
  if (v) {
    await nextTick()
    activeIdx.value >= 0 && lyricBox.value?.scrollTo({ top: 0 })
  }
})

function seekFromLine(t: number) {
  player.seek(t)
}

function seekByEvent(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  player.seek(v)
}

function toggleFav() {
  if (!player.current) return
  const added = library.toggleFav(player.current)
  toast(added ? '已收藏到我喜欢的音乐' : '已取消收藏', added ? 'ok' : 'info')
}

const modeLabel = computed(() => ({ order: '顺序', shuffle: '随机', loop: '单曲' }[player.mode]))
</script>

<template>
  <Teleport to="body">
    <Transition name="full">
      <div class="fp" v-if="player.current">
        <div class="glow" :style="{ backgroundImage: cover ? `url(${cover})` : 'none' }" />

        <header>
          <button class="close" title="收起" @click="emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div class="head-title">
            <p class="tag">正在播放 · {{ sourceLabel(player.current.source) }}</p>
            <p class="song">{{ player.current.name }}</p>
          </div>
          <button class="queue-btn" :title="showLyric ? '返回唱片' : '查看歌词'" @click="showLyric = !showLyric">
            <svg v-if="!showLyric" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14M5 10h14M5 15h6" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></svg>
          </button>
          <button class="queue-btn" title="播放队列" @click.stop="showQueue = !showQueue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h9" /></svg>
          </button>
        </header>

        <main class="stage" @click="showLyric = !showLyric">
          <!-- 黑胶 -->
          <div v-show="!showLyric" class="vinyl-stage">
            <div class="vinyl" :class="{ spinning: player.playing, paused: !player.playing }">
              <img v-if="cover" :src="cover" alt="" />
              <div v-else class="no-cover"><span>♪</span></div>
              <i class="ring r1" /><i class="ring r2" />
              <span class="label-dot" />
            </div>
            <div class="tonearm" :class="{ on: player.playing }">
              <i class="arm" /><i class="head" />
            </div>
          </div>

          <!-- 歌词 -->
          <div v-show="showLyric" class="lyric-stage">
            <div ref="lyricBox" class="lyric-box">
              <div class="pad" />
              <p
                v-for="(l, i) in player.lyric"
                :key="i"
                class="line"
                :class="{ active: i === activeIdx }"
                @click.stop="seekFromLine(l.t)"
              >
                {{ l.text }}
                <span v-if="l.tr" class="tr">{{ l.tr }}</span>
              </p>
              <p v-if="!player.lyric.length" class="no-lyric">纯音乐，请欣赏 · 或歌词加载中</p>
              <div class="pad" />
            </div>
          </div>

          <div class="track-info">
            <p class="artist">{{ player.current.artist.join(' / ') }}</p>
            <p v-if="player.current.album" class="album">{{ player.current.album }}</p>
          </div>
        </main>

        <footer>
          <div class="bar">
            <span class="time">{{ fmt(player.currentTime) }}</span>
            <input
              class="slider"
              type="range"
              min="0"
              step="0.1"
              :max="player.duration || 0"
              :value="player.currentTime"
              @input="seekByEvent"
            />
            <span class="time">{{ fmt(player.duration) }}</span>
          </div>

          <div class="controls">
            <button class="ghost" :title="modeLabel + '播放'" @click="player.setMode()">
              <svg v-if="player.mode === 'order'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h11l-3-3M20 17H9l3 3M4 7v0m16 10v0M4 17h2m12-10h2" /></svg>
              <svg v-else-if="player.mode === 'shuffle'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h4v4M4 20 20 4M16 20h4v-4M4 4l5 5" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5v4l-3-2a8 8 0 1 0 2.3 8" /></svg>
              <em>{{ modeLabel }}</em>
            </button>

            <button class="c-btn" title="上一首" @click="player.prev()">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h2v14H7zM20 5v14L9.5 12z" /></svg>
            </button>

            <button class="play" @click="player.toggle()">
              <span v-if="player.loading" class="loading-ring" />
              <svg v-else-if="player.playing" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            </button>

            <button class="c-btn" title="下一首" @click="player.next()">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5v14l10.5-7z" /></svg>
            </button>

            <button class="ghost" :class="{ fav: library.isFav(player.current) }" @click="toggleFav">
              <svg viewBox="0 0 24 24" :fill="library.isFav(player.current) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.5 12 20.5Z" />
              </svg>
            </button>
          </div>
        </footer>

        <!-- 播放队列抽屉 -->
        <Transition name="drawer">
          <div v-if="showQueue" class="queue-mask" @click.self="showQueue = false">
            <div class="queue card">
              <p class="q-title">播放队列 <em>{{ player.queue.length }} 首</em></p>
              <div class="q-list">
                <div
                  v-for="(t, i) in player.queue"
                  :key="trackKey(t) + i"
                  class="q-item"
                  :class="{ active: i === player.index }"
                  @click="player.index = i; player.loadAndPlay(); showQueue = false"
                >
                  <span class="q-idx">
                    <template v-if="i === player.index">
                      <span class="eq" :class="{ paused: !player.playing }"><i /><i /><i /></span>
                    </template>
                    <template v-else>{{ i + 1 }}</template>
                  </span>
                  <span class="q-name">{{ t.name }}</span>
                  <span class="q-artist">{{ t.artist.join('/') }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fp {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  background: linear-gradient(178deg, #10231d 0%, #0b1a15 46%, #0a0f0d 100%);
  color: #eae6da;
  overflow: hidden;
}

.glow {
  position: absolute;
  inset: -80px;
  background-size: cover;
  background-position: center;
  filter: blur(90px) saturate(1.15) brightness(0.5);
  opacity: 0.5;
  transition: background-image 0.6s ease;
}

header,
main,
footer {
  position: relative;
  z-index: 1;
}

header {
  display: flex;
  align-items: center;
  padding: 18px 22px;
  gap: 14px;
}
.close,
.queue-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: rgba(234, 230, 218, 0.75);
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(8px);
  transition: all 0.18s ease;
}
.close:hover,
.queue-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.close svg,
.queue-btn svg {
  width: 20px;
  height: 20px;
}

.head-title {
  flex: 1;
  text-align: center;
  min-width: 0;
}
.tag {
  font-size: 10.5px;
  letter-spacing: 0.3em;
  color: rgba(234, 230, 218, 0.55);
  text-transform: uppercase;
}
.song {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- 黑胶 ---------- */
.stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 26px;
}

.vinyl-stage {
  position: relative;
  display: grid;
  place-items: center;
  width: min(64vw, 320px);
  aspect-ratio: 1;
  margin-bottom: 8px;
  cursor: pointer;
}

.vinyl {
  position: relative;
  width: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, #191813 0 58%, #23211a 58% 60%, #191813 60% 100%);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
  animation: vspin 16s linear infinite;
  animation-play-state: paused;
}
.vinyl.spinning {
  animation-play-state: running;
}
.vinyl img {
  position: absolute;
  inset: 26%;
  width: 48%;
  height: 48%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(10, 12, 10, 0.9);
}
.no-cover {
  position: absolute;
  inset: 26%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, var(--jade) 0 40%, var(--jade-deep) 100%);
}
.no-cover span {
  font-family: var(--font-display);
  font-size: 40px;
  color: rgba(255, 255, 255, 0.9);
}
@keyframes vspin {
  to {
    transform: rotate(360deg);
  }
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  pointer-events: none;
}
.r1 {
  inset: 12%;
}
.r2 {
  inset: 30%;
}
.label-dot {
  position: absolute;
  inset: 47.2%;
  border-radius: 50%;
  background: #0a0f0d;
  box-shadow: 0 0 0 3px rgba(234, 230, 218, 0.25);
  pointer-events: none;
}

.tonearm {
  position: absolute;
  top: -4%;
  right: 2%;
  width: 34%;
  height: 34%;
  transform: rotate(-26deg);
  transform-origin: 82% 12%;
  transition: transform 0.5s cubic-bezier(0.3, 0.7, 0.3, 1);
  pointer-events: none;
}
.tonearm.on {
  transform: rotate(-8deg);
}
.tonearm .arm {
  position: absolute;
  top: 10%;
  left: 50%;
  width: 4px;
  height: 92%;
  border-radius: 4px;
  background: linear-gradient(#cfcabb, #8d887a);
}
.tonearm .head {
  position: absolute;
  bottom: -6%;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 26px;
  border-radius: 5px;
  background: #d8d3c6;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}
.tonearm::before {
  content: '';
  position: absolute;
  top: -2%;
  right: -4%;
  width: 26%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ece7da, #9a958a 70%);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.45);
}

/* ---------- 歌词 ---------- */
.lyric-stage {
  flex: 1;
  min-height: 0;
  width: min(560px, 100%);
  cursor: pointer;
  display: flex;
}
.lyric-box {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(transparent, #000 18%, #000 82%, transparent);
}
.lyric-box::-webkit-scrollbar {
  display: none;
}
.pad {
  height: 34%;
  min-height: 80px;
}
.line {
  padding: 9px 6px;
  font-size: 16.5px;
  line-height: 1.5;
  color: rgba(234, 230, 218, 0.45);
  transition: color 0.3s ease, transform 0.3s ease, text-shadow 0.3s ease;
  cursor: pointer;
  text-align: center;
}
.line:hover {
  color: rgba(234, 230, 218, 0.8);
}
.line.active {
  color: #fdfcf7;
  font-weight: 700;
  font-size: 19px;
  transform: scale(1.02);
  text-shadow: 0 0 24px rgba(255, 107, 74, 0.35);
}
.tr {
  display: block;
  font-size: 12.5px;
  opacity: 0.62;
  margin-top: 3px;
  font-weight: 400;
}
.no-lyric {
  text-align: center;
  color: rgba(234, 230, 218, 0.4);
  padding: 40px 0;
}

.track-info {
  text-align: center;
  margin: 6px 0 4px;
}
.artist {
  font-size: 14px;
  color: rgba(234, 230, 218, 0.85);
  letter-spacing: 0.06em;
}
.album {
  font-size: 12px;
  color: rgba(234, 230, 218, 0.45);
  margin-top: 2px;
}

/* ---------- 底部控制 ---------- */
footer {
  padding: 10px 26px calc(22px + env(safe-area-inset-bottom));
}

.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 560px;
  margin: 0 auto 14px;
}
.time {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgba(234, 230, 218, 0.5);
  width: 38px;
  flex: none;
}
.time:last-child {
  text-align: right;
}
.slider {
  flex: 1;
  accent-color: var(--coral);
  cursor: pointer;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: rgba(234, 230, 218, 0.65);
  transition: color 0.2s ease;
}
.ghost:hover {
  color: #fff;
}
.ghost.fav {
  color: var(--coral);
}
.ghost svg {
  width: 21px;
  height: 21px;
}
.ghost em {
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.15em;
}

.c-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #eae6da;
  background: rgba(255, 255, 255, 0.07);
  transition: all 0.18s ease;
}
.c-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.04);
}
.c-btn svg {
  width: 22px;
  height: 22px;
}

.play {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--coral), #e5532f);
  color: #fff;
  box-shadow: 0 10px 30px rgba(255, 107, 74, 0.4);
  transition: transform 0.16s ease;
}
.play:hover {
  transform: scale(1.06);
}
.play svg {
  width: 28px;
  height: 28px;
}
.loading-ring {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: rot 0.8s linear infinite;
}
@keyframes rot {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- 队列抽屉 ---------- */
.queue-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(8, 12, 10, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
}
.queue {
  width: 100%;
  max-height: 62%;
  border-radius: 22px 22px 0 0;
  background: #171d1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  color: #eae6da;
  display: flex;
  flex-direction: column;
}
.q-title {
  padding: 16px 20px 10px;
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.08em;
}
.q-title em {
  font-style: normal;
  font-size: 11px;
  color: rgba(234, 230, 218, 0.45);
  margin-left: 8px;
}
.q-list {
  overflow-y: auto;
  padding: 0 10px 18px;
}
.q-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  min-width: 0;
}
.q-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
.q-item.active {
  background: rgba(255, 107, 74, 0.12);
}
.q-idx {
  width: 26px;
  flex: none;
  text-align: center;
  font-size: 12px;
  color: rgba(234, 230, 218, 0.4);
  font-variant-numeric: tabular-nums;
}
.q-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.q-item.active .q-name {
  color: var(--coral);
  font-weight: 700;
}
.q-artist {
  flex: none;
  max-width: 40%;
  font-size: 11.5px;
  color: rgba(234, 230, 218, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.q-item .eq i {
  background: var(--coral);
}

/* 动效 */
.full-enter-active {
  transition: transform 0.42s cubic-bezier(0.3, 0.8, 0.3, 1), opacity 0.42s ease;
}
.full-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.full-enter-from,
.full-leave-to {
  transform: translateY(8%);
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(40px);
  opacity: 0;
}

@media (max-width: 768px) {
  header {
    padding: 14px 16px;
  }
  .stage {
    padding: 0 18px;
  }
  .vinyl-stage {
    width: min(74vw, 300px);
  }
  .line {
    font-size: 15px;
  }
  .line.active {
    font-size: 17.5px;
  }
  footer {
    padding: 8px 18px calc(18px + env(safe-area-inset-bottom));
  }
  .controls {
    gap: 14px;
  }
  .play {
    width: 60px;
    height: 60px;
  }
}
</style>
