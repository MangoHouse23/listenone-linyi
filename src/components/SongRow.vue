<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import type { Track } from '../api/listen1'
import { sourceLabel } from '../api/listen1'
import { usePlayer } from '../stores/player'
import { useLibrary, trackKey } from '../stores/library'
import { useCover } from '../composables/cover'
import { toast } from '../utils/emitter'

const props = defineProps<{
  track: Track
  index?: number
  hideCover?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{ removed: [track: Track] }>()

const player = usePlayer()
const library = useLibrary()

const cover = useCover(() => props.track, 120)

const isCurrent = computed(() => {
  const c = player.current
  return !!c && trackKey(c) === trackKey(props.track)
})

const menuOpen = ref(false)
const rowEl = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (menuOpen.value && rowEl.value && !rowEl.value.contains(e.target as Node)) menuOpen.value = false
}
document.addEventListener('click', onDocClick)
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function play() {
  player.playTrack(props.track)
}

function toggleFav() {
  const added = library.toggleFav(props.track)
  toast(added ? '已收藏到我喜欢的音乐' : '已取消收藏', added ? 'ok' : 'info')
}

function addTo(pid: string, name: string) {
  const r = library.addToPlaylist(pid, props.track)
  if (r === 'added') toast(`已加入「${name}」`, 'ok')
  else if (r === 'dup') toast('这首歌已在歌单里啦')
  menuOpen.value = false
}

function remove() {
  emit('removed', props.track)
}
</script>

<template>
  <div ref="rowEl" class="song-row" :class="{ current: isCurrent }" @dblclick="play">
    <div class="idx">
      <span v-if="!isCurrent" class="num">{{ String(index ?? '').padStart(2, '0') }}</span>
      <span v-else class="eq" :class="{ paused: !player.playing }"><i /><i /><i /></span>
    </div>

    <img v-if="!hideCover" :src="cover" class="cover" loading="lazy" alt="" />

    <div class="meta" @click="play">
      <p class="name" :title="track.name">{{ track.name }}</p>
      <p class="sub" :title="track.artist.join(' / ') + ' · ' + track.album">
        {{ track.artist.join(' / ') }}<template v-if="track.album"> · {{ track.album }}</template>
      </p>
    </div>

    <span class="badge">{{ sourceLabel(track.source) }}</span>

    <button class="icon-btn" title="收藏" @click.stop="toggleFav">
      <svg viewBox="0 0 24 24" :fill="library.isFav(track) ? 'var(--coral)' : 'none'" :stroke="library.isFav(track) ? 'var(--coral)' : 'currentColor'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.5 12 20.5Z" />
      </svg>
    </button>

    <div class="more-wrap">
      <button class="icon-btn" title="加入歌单" @click.stop="menuOpen = !menuOpen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <Transition name="pop">
        <div v-if="menuOpen" class="menu card">
          <p class="menu-title">加入歌单</p>
          <button v-for="pl in library.playlists" :key="pl.id" class="menu-item" @click="addTo(pl.id, pl.name)">
            {{ pl.name }}<em>{{ pl.tracks.length }}</em>
          </button>
          <p v-if="!library.playlists.length" class="menu-empty">先去「我的」新建一个歌单吧</p>
        </div>
      </Transition>
    </div>

    <button v-if="removable" class="icon-btn" title="移出歌单" @click.stop="remove">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M5 12h14" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.song-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 12px;
  border-radius: 14px;
  transition: background 0.18s ease;
  min-width: 0;
}
.song-row:hover {
  background: color-mix(in srgb, var(--bg-soft) 70%, transparent);
}
.song-row.current {
  background: var(--jade-mist);
}

.idx {
  width: 30px;
  flex: none;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.num {
  color: var(--ink-3);
  font-size: 12.5px;
  letter-spacing: 0.05em;
}

.cover {
  width: 46px;
  height: 46px;
  flex: none;
  border-radius: 10px;
  object-fit: cover;
  background: linear-gradient(135deg, var(--jade-mist), var(--coral-soft));
  box-shadow: var(--shadow-1);
  cursor: pointer;
}

.meta {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.name {
  font-size: 14.5px;
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.current .name {
  color: var(--jade-deep);
  font-weight: 700;
}
.sub {
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.badge {
  flex: none;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}

.icon-btn {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  transition: all 0.18s ease;
  opacity: 0.65;
}
.song-row:hover .icon-btn {
  opacity: 1;
}
.icon-btn:hover {
  color: var(--jade-deep);
  background: var(--bg-soft);
}
.icon-btn svg {
  width: 17px;
  height: 17px;
}

.more-wrap {
  position: relative;
  flex: none;
}

.menu {
  position: absolute;
  right: 0;
  top: 36px;
  z-index: 60;
  min-width: 172px;
  max-height: 240px;
  overflow: auto;
  padding: 8px;
}
.menu-title {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
  padding: 4px 10px 6px;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 9px;
  font-size: 13px;
}
.menu-item:hover {
  background: var(--jade-mist);
  color: var(--jade-deep);
}
.menu-item em {
  font-style: normal;
  font-size: 11px;
  color: var(--ink-3);
}
.menu-empty {
  padding: 6px 10px 8px;
  font-size: 12px;
  color: var(--ink-3);
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.18s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
</style>
