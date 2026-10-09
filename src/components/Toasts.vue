<script setup lang="ts">
import { ref } from 'vue'
import { bus, type ToastMsg } from '../utils/emitter'
import { onMounted } from 'vue'

const list = ref<ToastMsg[]>([])
const timers = new Map<number, number>()

onMounted(() => {
  bus.on('toast', (raw) => {
    const msg = raw as ToastMsg
    list.value.push(msg)
    if (list.value.length > 3) list.value.shift()
    timers.set(
      msg.id,
      window.setTimeout(() => {
        list.value = list.value.filter((t) => t.id !== msg.id)
      }, 2600),
    )
  })
})
</script>

<template>
  <Teleport to="body">
    <div class="toasts">
      <TransitionGroup name="toast">
        <div v-for="t in list" :key="t.id" class="toast" :class="t.kind">
          <i v-if="t.kind === 'ok'" class="dot ok" />
          <i v-else-if="t.kind === 'error'" class="dot err" />
          {{ t.text }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  width: max-content;
  max-width: 86vw;
}

.toast {
  background: rgba(35, 34, 28, 0.92);
  color: #f4f1e8;
  font-size: 13px;
  letter-spacing: 0.03em;
  padding: 9px 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-2);
  max-width: 100%;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.dot.ok {
  background: #5fd4a2;
}
.dot.err {
  background: var(--coral);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-14px) scale(0.92);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
