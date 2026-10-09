<script setup lang="ts">
const tabs = [
  { to: '/', label: '发现', icon: 'M12 4v16M4 12h16' },
  { to: '/search', label: '搜索', icon: 'M15.5 15.5 21 21M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z' },
  { to: '/charts', label: '榜单', icon: 'M4 20V10M10 20V4M16 20v-8' },
  { to: '/fm', label: 'FM', icon: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Zm9 0h.01' },
  { to: '/library', label: '我的', icon: 'M6 4h12v16l-6-4-6 4V4Z' },
]
</script>

<template>
  <nav class="tabbar">
    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab" active-class="active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path :d="t.icon" />
      </svg>
      <span>{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(18px);
  border-top: 1px solid var(--line);
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 0;
  color: var(--ink-3);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  transition: color 0.2s ease;
}
.tab svg {
  width: 22px;
  height: 22px;
}
.tab.active {
  color: var(--jade-deep);
  font-weight: 600;
}
</style>
