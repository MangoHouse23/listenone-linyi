<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlaylistDetail, type PlaylistDetail, type Track } from '../api/listen1'
import SongRow from '../components/SongRow.vue'
import { usePlayer } from '../stores/player'
import { useLibrary } from '../stores/library'
import { useCover } from '../composables/cover'
import { toast } from '../utils/emitter'

const route = useRoute()
const router = useRouter()
const player = usePlayer()
const library = useLibrary()

const isLocal = computed(() => String(route.params.id).startsWith('local-'))

const neteaseDetail = ref<PlaylistDetail | null>(null)
const loading = ref(false)
const error = ref('')

const localPlaylist = computed(() => library.playlists.find((p) => p.id === route.params.id) ?? null)
const isFavList = computed(() => route.params.id === 'fav')

const name = computed(() => {
  if (isLocal.value) return localPlaylist.value?.name ?? '歌单'
  if (isFavList.value) return '我喜欢的音乐'
  return neteaseDetail.value?.name ?? '加载中'
})

const tracks = computed<Track[]>(() => {
  if (isLocal.value) return localPlaylist.value?.tracks ?? []
  if (isFavList.value) return library.favorites
  return neteaseDetail.value?.tracks ?? []
})

const cover = useCover(computed(() => tracks.value[0] ?? null), 300)

async function load() {
  if (isLocal.value || isFavList.value) return
  loading.value = true
  error.value = ''
  neteaseDetail.value = null
  try {
    neteaseDetail.value = await getPlaylistDetail(String(route.params.id))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load, { immediate: true })

function playAll(shuffle = false) {
  if (!tracks.value.length) return
  const start = shuffle ? Math.floor(Math.random() * tracks.value.length) : 0
  if (shuffle && player.mode !== 'shuffle') player.mode = 'shuffle'
  if (!shuffle && player.mode === 'shuffle') player.mode = 'order'
  player.playQueue(tracks.value, start)
}

function collectAll() {
  let added = 0
  for (const t of tracks.value) {
    if (!library.isFav(t)) {
      library.toggleFav(t)
      added++
    }
  }
  toast(added ? `已收藏 ${added} 首到「我喜欢的音乐」` : '都在收藏里啦', added ? 'ok' : 'info')
}

function removeLocal(t: Track) {
  if (localPlaylist.value) library.removeFromPlaylist(localPlaylist.value.id, t)
}

const savePlaylist = () => {
  if (isFavList.value && library.playlists.every((p) => p.id !== 'fav-backup')) {
    library.createPlaylist('我喜欢的音乐备份')
  }
}
</script>

<template>
  <div class="playlist">
    <button class="back" @click="router.back()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      返回
    </button>

    <!-- 头部 -->
    <section class="head card" :class="{ skeleton: loading && !tracks.length }">
      <div class="cover">
        <img v-if="cover" :src="cover" alt="" />
        <div v-else class="ph"><span>♪</span></div>
      </div>
      <div class="info">
        <p class="kind">{{ isLocal ? '自建歌单' : isFavList ? '我的收藏' : '官方榜单 / 歌单' }}</p>
        <h1>{{ name }}</h1>
        <p class="meta">{{ tracks.length }} 首 · 数据来自聚合平台</p>
        <div class="actions">
          <button class="btn-primary" :disabled="!tracks.length" @click="playAll(false)">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5.5v13l11-6.5z" /></svg>
            播放全部
          </button>
          <button class="btn-ghost" :disabled="!tracks.length" @click="playAll(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M16 4h4v4M4 20 20 4M16 20h4v-4M4 4l5 5" /></svg>
            随机播放
          </button>
          <button v-if="!isLocal && !isFavList && tracks.length" class="btn-ghost" @click="collectAll">收全部入喜欢</button>
          <button v-if="isFavList && tracks.length" class="btn-ghost" @click="savePlaylist">备份为歌单</button>
        </div>
      </div>
    </section>

    <p v-if="error" class="empty-hint">
      榜单加载失败：{{ error }}
      <button class="retry" @click="load">重试</button>
    </p>
    <p v-else-if="!loading && !tracks.length" class="empty-hint">
      {{ isLocal || isFavList ? '这里还空空的，去搜索页发现好歌吧' : '暂无内容' }}
    </p>

    <!-- 曲目列表 -->
    <div v-else class="list card">
      <SongRow
        v-for="(t, i) in tracks.slice(0, 300)"
        :key="`${t.source}:${t.id}:${i}`"
        :track="t"
        :index="i + 1"
        :removable="isLocal"
        @removed="removeLocal"
      />
    </div>
  </div>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-3);
  font-size: 13px;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
  transition: color 0.2s ease;
}
.back:hover {
  color: var(--jade-deep);
}
.back svg {
  width: 17px;
  height: 17px;
}

.head {
  display: flex;
  gap: 26px;
  padding: 24px;
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.cover {
  width: 148px;
  height: 148px;
  flex: none;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(140deg, var(--jade), var(--jade-deep));
  box-shadow: var(--shadow-2);
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  position: absolute;
  inset: 0;
}
.cover {
  position: relative;
  display: grid;
  place-items: center;
}
.ph span {
  font-family: var(--font-display);
  font-size: 52px;
  color: rgba(255, 255, 255, 0.9);
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.kind {
  font-size: 10.5px;
  letter-spacing: 0.28em;
  color: var(--ink-3);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.info h1 {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 28px);
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1.35;
}
.meta {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
}
.actions {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.list {
  padding: 10px;
  border-radius: var(--radius-lg);
}

.retry {
  margin-left: 10px;
  padding: 5px 16px;
  border-radius: 999px;
  border: 1px solid var(--jade);
  color: var(--jade-deep);
  font-size: 12px;
  letter-spacing: 0.08em;
  transition: all 0.18s ease;
}
.retry:hover {
  background: var(--jade-deep);
  color: #f4f1e8;
}

@media (max-width: 860px) {
  .head {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
    padding: 20px 16px;
  }
  .cover {
    width: 128px;
    height: 128px;
  }
  .actions {
    justify-content: center;
  }
}
</style>
