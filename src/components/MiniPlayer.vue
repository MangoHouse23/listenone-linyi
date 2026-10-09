<script setup lang="ts">
import { computed } from 'vue'
import { usePlayer } from '../stores/player'
import { useLibrary } from '../stores/library'
import { useCover } from '../composables/cover'
import { toast } from '../utils/emitter'

const player = usePlayer()
const library = useLibrary()

const emit = defineEmits<{ expand: [] }>()

const cover = useCover(() => player.current, 120)

const progress = computed(() => (player.duration > 0 ? player.currentTime / player.duration : 0))

function toggleFav() {
  if (!player.current) return
  const added = library.toggleFav(player.current)
  toast(added ? '已收藏' : '已取消收藏', added ? 'ok' : 'info')
}
</script>

<template>
  <div v-if="player.current" class="mini card">
    <div class="progress" :style="{ transform: `scaleX(${progress})` }" />

    <div class="left" @click="emit('expand')">
      <img :src="cover" class="disc" :class="{ spinning: player.playing }" alt="" />
      <div class="info">
        <p class="name">{{ player.current.name }}</p>
        <p class="artist">{{ player.current.artist.join(' / ') }}</p>
      </div>
    </div>

    <div class="right">
      <button class="c-btn hide-sm" title="收藏" @click="toggleFav">
        <svg viewBox="0 0 24 24" :fill="library.isFav(player.current) ? 'var(--coral)' : 'none'" :stroke="library.isFav(player.current) ? 'var(--coral)' : 'currentColor'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.5 12 20.5Z" />
        </svg>
      </button>

      <button class="c-btn hide-sm" title="上一首" @click="player.prev()">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h2v14H7zM20 5v14L9.5 12z" /></svg>
      </button>

      <button class="play-btn" :title="player.playing ? '暂停' : '播放'" @click="player.toggle()">
        <span v-if="player.loading" class="loading-ring" />
        <svg v-else-if="player.playing" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
      </button>

      <button class="c-btn" title="下一首" @click="player.next()">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5v14l10.5-7z" /></svg>
      </button>

      <div class="vol hide-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" @click="player.toggleMute()">
          <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4zM15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="player.muted ? 0 : player.volume"
          @input="player.setVolume(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 14px 12px;
  padding: 10px 16px 10px 12px;
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
}

.progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, var(--coral), var(--jade));
  transform-origin: left;
  transition: transform 0.25s linear;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.disc {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, var(--jade-mist), var(--coral-soft));
  border: 3px solid #1c1b17;
  box-shadow: var(--shadow-1);
  flex: none;
}
.disc.spinning {
  animation: spin 9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.info {
  min-width: 0;
}
.name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.artist {
  font-size: 11.5px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.c-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink-2);
  transition: all 0.18s ease;
}
.c-btn:hover {
  color: var(--jade-deep);
  background: var(--bg-soft);
}
.c-btn svg {
  width: 19px;
  height: 19px;
}

.play-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--jade-deep);
  color: #f4f1e8;
  display: grid;
  place-items: center;
  box-shadow: 0 6px 16px rgba(12, 83, 64, 0.3);
  transition: transform 0.15s ease, background 0.18s ease;
}
.play-btn:hover {
  background: var(--jade);
  transform: scale(1.05);
}
.play-btn svg {
  width: 20px;
  height: 20px;
}
.loading-ring {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(244, 241, 232, 0.35);
  border-top-color: #f4f1e8;
  animation: rot 0.8s linear infinite;
}
@keyframes rot {
  to {
    transform: rotate(360deg);
  }
}

.vol {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  color: var(--ink-2);
}
.vol svg {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.vol input {
  width: 86px;
  accent-color: var(--jade-deep);
  cursor: pointer;
}

@media (max-width: 768px) {
  .mini {
    margin: 0 10px 8px;
    padding: 8px 10px 8px 10px;
    gap: 10px;
  }
  .disc {
    width: 42px;
    height: 42px;
  }
}
</style>
