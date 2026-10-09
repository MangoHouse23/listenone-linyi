<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { HOT_KEYWORDS, probeSources, searchTracks, sourceLabel, type Track } from '../api/listen1'
import SongRow from '../components/SongRow.vue'
import { usePlayer } from '../stores/player'
import { toast } from '../utils/emitter'

const player = usePlayer()

const keyword = ref('')
const sources = ref<string[]>(['netease'])
const source = ref('netease')
const results = ref<Track[]>([])
const page = ref(1)
const totalLoaded = ref(false)
const searching = ref(false)
const searched = ref(false)

const inputEl = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  inputEl.value?.focus()
  const alive = await probeSources()
  sources.value = alive
  if (!alive.includes(source.value)) source.value = alive[0] ?? 'netease'
})

let timer: number | undefined
watch([keyword, source], () => {
  clearTimeout(timer)
  timer = window.setTimeout(() => {
    page.value = 1
    results.value = []
    totalLoaded.value = false
    if (keyword.value.trim()) doSearch(true)
  }, 420)
})

async function doSearch(reset: boolean) {
  const kw = keyword.value.trim()
  if (!kw) return
  searching.value = true
  searched.value = true
  try {
    const list = await searchTracks(source.value, kw, page.value, 30)
    if (reset) results.value = list
    else results.value.push(...list)
    if (list.length < 30) totalLoaded.value = true
  } catch {
    if (reset) results.value = []
    toast('搜索失败，请检查网络后重试', 'error')
  } finally {
    searching.value = false
  }
}

function loadMore() {
  page.value += 1
  doSearch(false)
}

function playAll() {
  if (results.value.length) {
    player.playQueue(results.value, 0)
    toast('已开始播放搜索结果', 'ok')
  }
}

function searchNow() {
  clearTimeout(timer)
  page.value = 1
  results.value = []
  totalLoaded.value = false
  doSearch(true)
}
</script>

<template>
  <div class="search">
    <header class="page-head">
      <h1>聚合搜索</h1>
      <p>一次输入，多平台曲库同时找</p>
    </header>

    <!-- 搜索框 -->
    <div class="box card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
      <input
        ref="inputEl"
        v-model="keyword"
        placeholder="搜索歌曲 / 歌手 / 专辑，回车立即搜索"
        @keydown.enter="searchNow"
      />
      <button v-if="keyword" class="clear" @click="keyword = ''; results = []; searched = false">✕</button>
    </div>

    <!-- 平台胶囊 -->
    <div class="pills">
      <button
        v-for="s in sources"
        :key="s"
        class="pill"
        :class="{ on: source === s }"
        @click="source = s"
      >
        {{ sourceLabel(s) }}
      </button>
    </div>

    <!-- 热门关键词 -->
    <div v-if="!searched" class="hot">
      <p class="hot-label">大家都在听</p>
      <div class="chips">
        <button v-for="k in HOT_KEYWORDS" :key="k" class="chip" @click="keyword = k">{{ k }}</button>
      </div>
    </div>

    <!-- 结果 -->
    <template v-if="results.length">
      <div class="result-head">
        <span>「{{ keyword }}」找到 {{ results.length }} 首</span>
        <button class="play-all" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5.5v13l11-6.5z" /></svg>
          播放全部
        </button>
      </div>
      <div class="list card">
        <SongRow v-for="(t, i) in results" :key="`${t.source}:${t.id}:${i}`" :track="t" :index="i + 1" />
      </div>
      <div v-if="!totalLoaded" class="more-wrap">
        <button class="btn-ghost" :disabled="searching" @click="loadMore">
          {{ searching ? '加载中…' : '加载更多' }}
        </button>
      </div>
    </template>

    <p v-else-if="searching" class="empty-hint">正在搜索…</p>
    <p v-else-if="searched && !results.length" class="empty-hint">没有找到相关歌曲，换个关键词试试</p>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 22px;
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

.box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 20px;
  border-radius: 999px;
  box-shadow: var(--shadow-1);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.box:focus-within {
  border-color: var(--jade);
  box-shadow: 0 4px 22px rgba(20, 124, 90, 0.14);
}
.box svg {
  width: 19px;
  height: 19px;
  color: var(--ink-3);
  flex: none;
}
.box input {
  flex: 1;
  font-size: 15px;
  letter-spacing: 0.03em;
}
.box input::placeholder {
  color: var(--ink-3);
}
.clear {
  color: var(--ink-3);
  font-size: 13px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
}
.clear:hover {
  background: var(--bg-soft);
  color: var(--ink);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin: 16px 0 6px;
}
.pill {
  padding: 7px 17px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink-2);
  font-size: 13px;
  letter-spacing: 0.05em;
  background: var(--surface);
  transition: all 0.2s ease;
}
.pill:hover {
  border-color: var(--jade);
  color: var(--jade-deep);
}
.pill.on {
  background: var(--jade-deep);
  border-color: var(--jade-deep);
  color: #f4f1e8;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(12, 83, 64, 0.28);
}

.hot {
  margin-top: 26px;
}
.hot-label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
  margin-bottom: 12px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  padding: 8px 18px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 13.5px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  transition: all 0.2s ease;
}
.chip:hover {
  background: var(--coral-soft);
  border-color: var(--coral);
  color: #c2431f;
  transform: translateY(-2px);
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 2px 12px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.play-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--jade-deep);
  font-weight: 600;
  font-size: 13px;
}
.play-all:hover {
  text-decoration: underline;
}

.list {
  padding: 10px;
}

.more-wrap {
  text-align: center;
  margin-top: 18px;
}
</style>
