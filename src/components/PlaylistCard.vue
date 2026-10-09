<script setup lang="ts">
defineProps<{
  name: string
  cover: string
  count?: number
  tint?: string
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button class="pl-card" :style="tint ? { '--tint': tint } : undefined" @click="emit('click')">
    <div class="cover-wrap">
      <img v-if="cover" :src="cover" loading="lazy" alt="" />
      <div v-else class="fallback"><span>♪</span></div>
      <span v-if="count" class="count">{{ count }} 首</span>
    </div>
    <p class="name">{{ name }}</p>
  </button>
</template>

<style scoped>
.pl-card {
  text-align: left;
  display: block;
  width: 100%;
  --tint: var(--jade);
}

.cover-wrap {
  position: relative;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(150deg, color-mix(in srgb, var(--tint) 78%, #ffffff), color-mix(in srgb, var(--tint) 40%, #f4f1e8));
  box-shadow: var(--shadow-1);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.pl-card:hover .cover-wrap {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2);
}
.cover-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.fallback span {
  font-family: var(--font-display);
  font-size: 44px;
  color: rgba(255, 255, 255, 0.85);
}

.count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 10.5px;
  color: #fff;
  background: rgba(20, 20, 16, 0.45);
  backdrop-filter: blur(6px);
  padding: 2px 9px;
  border-radius: 999px;
  letter-spacing: 0.06em;
}

.name {
  margin-top: 9px;
  font-size: 13px;
  font-weight: 550;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
