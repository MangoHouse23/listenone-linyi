<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SongRow from '../components/SongRow.vue'
import PlaylistCard from '../components/PlaylistCard.vue'
import { useLibrary, trackKey } from '../stores/library'
import { usePlayer } from '../stores/player'
import { toast } from '../utils/emitter'

const router = useRouter()
const library = useLibrary()
const player = usePlayer()

const newPlaylistName = ref('')
const creating = ref(false)
const activeTab = ref<'playlists' | 'recent'>('playlists')

function createPlaylist() {
  const pl = library.createPlaylist(newPlaylistName.value)
  if (pl) {
    toast(`歌单「${pl.name}」已创建`, 'ok')
    newPlaylistName.value = ''
  } else {
    toast('先给歌单起个名字吧')
  }
}

function playAllOf(tracks: Parameters<typeof player.playQueue>[0]) {
  if (tracks.length) player.playQueue(tracks, 0)
}

function deletePlaylist(id: string, name: string) {
  library.deletePlaylist(id)
  toast(`已删除「${name}」`, 'info')
}
</script>

<template>
  <div class="library">
    <header class="page-head">
      <h1>我的音乐</h1>
      <p>收藏、最近播放与自建歌单，都保存在这台设备上</p>
    </header>

    <!-- 快捷入口 -->
    <section class="quick stagger">
      <button class="quick-card card fav" @click="router.push('/playlist/fav')">
        <span class="q-icon">♥</span>
        <div>
          <p class="q-name">我喜欢的音乐</p>
          <p class="q-sub">{{ library.favorites.length }} 首</p>
        </div>
      </button>
      <button class="quick-card card recent" :class="{ on: activeTab === 'recent' }" @click="activeTab = 'recent'">
        <span class="q-icon">◷</span>
        <div>
          <p class="q-name">最近播放</p>
          <p class="q-sub">{{ library.recents.length }} 条记录</p>
        </div>
      </button>
      <button class="quick-card card fm" @click="router.push('/fm')">
        <span class="q-icon">✦</span>
        <div>
          <p class="q-name">私人 FM</p>
          <p class="q-sub">一直播下去</p>
        </div>
      </button>
    </section>

    <!-- 自建歌单 -->
    <section class="block">
      <div class="head">
        <h2 class="section-title">自建歌单 <small>{{ library.playlists.length }} 个</small></h2>
        <div class="create">
          <input v-model="newPlaylistName" placeholder="新建歌单名…" maxlength="20" @keydown.enter="createPlaylist" />
          <button class="btn-primary sm" :disabled="creating" @click="createPlaylist">＋ 新建</button>
        </div>
      </div>

      <div v-if="library.playlists.length" class="pl-grid">
        <div v-for="pl in library.playlists" :key="pl.id" class="pl-item">
          <PlaylistCard
            :name="pl.name"
            :cover="pl.tracks[0]?.picUrl ?? ''"
            :count="pl.tracks.length"
            @click="router.push(`/playlist/${pl.id}`)"
          />
          <button class="del" title="删除歌单" @click.stop="deletePlaylist(pl.id, pl.name)">✕</button>
        </div>
      </div>
      <p v-else class="empty-hint">还没有歌单，输入名字创建一个吧</p>
    </section>

    <!-- 最近播放 -->
    <section v-if="activeTab === 'recent'" class="block">
      <div class="head">
        <h2 class="section-title">最近播放 <small>RECENT</small></h2>
        <button v-if="library.recents.length" class="btn-ghost sm" @click="playAllOf(library.recents.map((r) => r.track))">
          播放全部
        </button>
      </div>
      <div v-if="library.recents.length" class="list card">
        <SongRow v-for="(r, i) in library.recents.slice(0, 50)" :key="trackKey(r.track) + i" :track="r.track" :index="i + 1" />
      </div>
      <p v-else class="empty-hint">暂无播放记录</p>
    </section>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 24px;
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

.quick {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 34px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2);
}
.q-icon {
  font-size: 22px;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex: none;
}
.quick-card.fav .q-icon {
  background: var(--coral-soft);
  color: #c2431f;
}
.quick-card.recent .q-icon {
  background: var(--jade-mist);
  color: var(--jade-deep);
}
.quick-card.fm .q-icon {
  background: #fdeecb;
  color: #b37514;
}
.q-name {
  font-weight: 650;
  font-size: 14.5px;
}
.q-sub {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 2px;
}

.block {
  margin-bottom: 32px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.create {
  display: flex;
  align-items: center;
  gap: 8px;
}
.create input {
  width: 180px;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  font-size: 13px;
  transition: border-color 0.2s ease;
}
.create input:focus {
  border-color: var(--jade);
}
.btn-primary.sm {
  padding: 9px 16px;
  font-size: 13px;
}
.btn-ghost.sm {
  padding: 8px 16px;
}

.pl-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
}
.pl-item {
  position: relative;
}
.del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--bg);
  font-size: 11px;
  display: grid;
  place-items: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.18s ease;
  z-index: 5;
}
.pl-item:hover .del {
  opacity: 1;
  transform: scale(1);
}
.del:hover {
  background: var(--coral);
}

.list {
  padding: 10px;
}

@media (max-width: 860px) {
  .quick {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .pl-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .create input {
    width: 130px;
  }
}
</style>
