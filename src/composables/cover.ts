import { ref, watchEffect, type MaybeRefOrGetter, toValue } from 'vue'
import { getTrackPic, type Track } from '../api/listen1'

const resolved = new Map<string, string>()

/** 懒解析曲目封面（带全局缓存，支持 ref 或 getter） */
export function useCover(track: MaybeRefOrGetter<Track | null | undefined>, size = 300) {
  const url = ref('')

  watchEffect(async () => {
    const t = toValue(track)
    url.value = ''
    if (!t) return
    const key = `${t.source}:${t.picId || t.picUrl || t.id}:${size}`
    const hit = resolved.get(key)
    if (hit) {
      url.value = hit
      return
    }
    if (!t.picId && !t.picUrl) return
    try {
      const u = await getTrackPic(t, size)
      resolved.set(key, u)
      if (toValue(track) === t) url.value = u
    } catch {
      /* 静默：使用渐变占位 */
    }
  })

  return url
}
