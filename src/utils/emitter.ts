/** 极简事件总线 + 全局 Toast */
type Handler = (payload?: unknown) => void

const handlers = new Map<string, Set<Handler>>()

export const bus = {
  on(ev: string, fn: Handler) {
    if (!handlers.has(ev)) handlers.set(ev, new Set())
    handlers.get(ev)!.add(fn)
    return () => handlers.get(ev)?.delete(fn)
  },
  emit(ev: string, payload?: unknown) {
    handlers.get(ev)?.forEach((fn) => fn(payload))
  },
}

export interface ToastMsg {
  id: number
  text: string
  kind: 'info' | 'error' | 'ok'
}

let toastId = 0

export function toast(text: string, kind: ToastMsg['kind'] = 'info') {
  bus.emit('toast', { id: ++toastId, text, kind })
}
