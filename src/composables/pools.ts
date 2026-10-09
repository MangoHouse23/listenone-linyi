import { getPlaylistDetail, type Track } from '../api/listen1'

/** 按日期做稳定伪随机（每日推荐每天不同但当天固定） */
function seededShuffle<T>(list: T[], seed: number): T[] {
  const arr = list.slice()
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const dailyCache = new Map<string, Track[]>()

/** 每日 30 首：基于热歌榜每日换血 */
export async function getDailyTracks(): Promise<Track[]> {
  const today = new Date()
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const hit = dailyCache.get(key)
  if (hit) return hit
  const hot = await getPlaylistDetail('3778678')
  const seed = Number(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`)
  const picks = seededShuffle(hot.tracks, seed).slice(0, 30)
  dailyCache.set(key, picks)
  return picks
}

/** 私人 FM 池：热歌 + 飙升 合并去重后打乱 */
const fmCache = new Map<string, Track[]>()

export async function getFmPool(): Promise<Track[]> {
  const today = new Date().toDateString()
  const hit = fmCache.get(today)
  if (hit) return hit
  const [hot, rise] = await Promise.all([getPlaylistDetail('3778678'), getPlaylistDetail('19723756')])
  const seen = new Set<string>()
  const merged: Track[] = []
  for (const t of [...hot.tracks, ...rise.tracks]) {
    const k = `${t.source}:${t.id}`
    if (!seen.has(k)) {
      seen.add(k)
      merged.push(t)
    }
  }
  const pool = seededShuffle(merged, Date.now() % 100000)
  fmCache.set(today, pool)
  return pool
}
