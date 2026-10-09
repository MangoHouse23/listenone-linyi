<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navItems = [
  { to: '/', label: '发现', icon: 'M12 3v18M3 12h18', rotate: 45 },
  { to: '/search', label: '搜索', icon: 'M15.5 15.5 21 21M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z' },
  { to: '/charts', label: '排行榜', icon: 'M4 20V10M10 20V4M16 20v-8M21 20H3' },
  { to: '/fm', label: '私人 FM', icon: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Zm9 0h.01' },
  { to: '/library', label: '我的', icon: 'M6 4h12v16l-6-4-6 4V4Z' },
]
</script>

<template>
  <aside class="sidenav">
    <div class="brand" @click="router.push('/')">
      <span class="vinyl"><i /><i /><i /></span>
      <div class="brand-text">
        <strong>聆一</strong>
        <em>ListenOne</em>
      </div>
    </div>

    <nav>
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path :d="item.icon" :style="item.rotate ? `transform: rotate(${item.rotate}deg); transform-origin: center` : ''" />
        </svg>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <footer>
      <p>聚合多平台曲库 · Listen 1 思路</p>
      <p>小清新聆听，从一个入口开始</p>
    </footer>
  </aside>
</template>

<style scoped>
.sidenav {
  display: flex;
  flex-direction: column;
  padding: 26px 16px;
  gap: 28px;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;
}

.vinyl {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: radial-gradient(circle at center, var(--coral) 0 6px, #f6f3ea 6px 9px, var(--jade-deep) 9px 100%);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(12, 83, 64, 0.3);
  display: grid;
  place-items: center;
  animation: spin 14s linear infinite;
}
.vinyl i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(246, 243, 234, 0.16);
  margin: 6px;
}
.vinyl i:nth-child(2) {
  margin: 12px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.brand-text strong {
  display: block;
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.28em;
  color: var(--jade-deep);
}
.brand-text em {
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--ink-3);
  text-transform: uppercase;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  color: var(--ink-2);
  font-size: 14.5px;
  letter-spacing: 0.06em;
  transition: all 0.2s ease;
}
.nav-item svg {
  width: 19px;
  height: 19px;
  opacity: 0.75;
}
.nav-item:hover {
  background: var(--bg-soft);
  color: var(--ink);
}
.nav-item.active {
  background: var(--jade-deep);
  color: #f4f1e8;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(12, 83, 64, 0.25);
}
.nav-item.active svg {
  opacity: 1;
}

footer {
  margin-top: auto;
  padding: 0 8px;
  font-size: 11px;
  color: var(--ink-3);
  line-height: 1.9;
  letter-spacing: 0.06em;
}
</style>
