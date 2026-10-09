/**
 * 聆一 ListenOne · 数据适配层
 * 基于 Listen 1 / Meting 系开放聚合接口（GDStudio 社区源，免费、允许跨域）
 * 支持运行时探测可用音乐平台源，接口恢复后自动启用聚合能力
 */

export interface Track {
  id: string
  name: string
  artist: string[]
  album: string
  picId?: string
  picUrl?: string
  lyricId?: string
  urlId?: string
  source: string
}

export interface PlaylistDetail {
  id: string
  name: string
  cover: string
  count: number
  tracks: Track[]
}

export interface ChartMeta {
  id: string
  name: string
  desc: string
  tint: string
}

const API = 'https://music-api.gdstudio.xyz/api.php'

/** 候选聚合源（Listen1 思路：一次搜索，多平台比价） */
export const SOURCE_LABELS: Record<string, string> = {
  netease: '网易云',
  tencent: 'QQ音乐',
  kugou: '酷狗',
  kuwo: '酷我',
  migu: '咪咕',
  joox: 'JOOX',
  ytmusic: 'YT Music',
  spotify: 'Spotify',
  tidal: 'TIDAL',
  deezer: 'Deezer',
}
const CANDIDATES = Object.keys(SOURCE_LABELS)

/* ---------------- 缓存 ---------------- */

const mem = new Map<string, { at: number; data: unknown }>()

function fromMem<T>(key: string, ttl: number): T | null {
  const hit = mem.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.data as T
  return null
}

function toMem(key: string, data: unknown) {
  mem.set(key, { at: Date.now(), data })
}

const LS_PREFIX = 'ly1:cache:'
const LS_LIMIT = 600

function lsRead<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const { at, data } = JSON.parse(raw) as { at: number; data: T }
    if (Date.now() - at > ttl) return null
    return data
  } catch {
    return null
  }
}

function lsWrite(key: string, data: unknown) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ at: Date.now(), data }))
    // 简易容量控制：超出上限时清除最早写入的一半
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX))
    if (keys.length > LS_LIMIT) {
      keys
        .sort((a, b) => {
          const ta = (JSON.parse(localStorage.getItem(a) || '{}').at as number) || 0
          const tb = (JSON.parse(localStorage.getItem(b) || '{}').at as number) || 0
          return ta - tb
        })
        .slice(0, Math.floor(LS_LIMIT / 2))
        .forEach((k) => localStorage.removeItem(k))
    }
  } catch {
    /* 存储不可用时静默降级 */
  }
}

/* ---------------- 基础请求（并发限制 + 失败重试 + 去重） ---------------- */

const MAX_CONCURRENT = 3
let active = 0
const waiting: (() => void)[] = []

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++
    return Promise.resolve()
  }
  return new Promise((resolve) => waiting.push(() => { active++; resolve() }))
}

function release() {
  active--
  waiting.shift()?.()
}

const inflight = new Map<string, Promise<unknown>>()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function apiGet<T>(params: Record<string, string | number>, timeoutMs = 15000): Promise<T> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v))
  const url = `${API}?${qs}`

  // 相同请求进行中则复用（发现页与榜单页会同时拉同一批歌单）
  const hit = inflight.get(url)
  if (hit) return hit as Promise<T>

  const task = (async () => {
    let lastErr: unknown
    // 最多 3 次：接口偶发 503/429 限流，退避后通常可恢复
    for (let attempt = 0; attempt < 3; attempt++) {
      await acquire()
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), timeoutMs)
        try {
          const res = await fetch(url, { signal: ctrl.signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return (await res.json()) as T
        } finally {
          clearTimeout(timer)
        }
      } catch (err) {
        lastErr = err
        if (attempt < 2) await sleep(900 * (attempt + 1) ** 2)
      } finally {
        release()
      }
    }
    throw lastErr
  })()

  inflight.set(url, task)
  task.catch(() => {}).finally(() => inflight.delete(url))
  return task
}

/* ---------------- 平台源探测 ---------------- */

const PROBE_KEY = 'sources'
const PROBE_TTL = 24 * 3600 * 1000

export async function probeSources(): Promise<string[]> {
  const cached = lsRead<string[]>(PROBE_KEY, PROBE_TTL)
  if (cached?.length) return cached
  const ok = await Promise.all(
    CANDIDATES.map(async (s) => {
      try {
        const r = await apiGet<unknown[]>({ types: 'search', source: s, name: '爱', count: 1, pages: 1 }, 8000)
        return Array.isArray(r) && r.length > 0 ? s : null
      } catch {
        return null
      }
    }),
  )
  const alive = ok.filter((s): s is string => s !== null)
  if (alive.length) lsWrite(PROBE_KEY, alive)
  return alive.length ? alive : ['netease']
}

export function sourceLabel(s: string) {
  return SOURCE_LABELS[s] ?? s
}

/* ---------------- 搜索 ---------------- */

interface RawSearchItem {
  id: string
  name: string
  artist: string[]
  album: string
  pic_id?: string
  lyric_id?: string
  url_id?: string
  source: string
}

export async function searchTracks(source: string, keyword: string, page = 1, count = 30): Promise<Track[]> {
  const key = `search:${source}:${keyword}:${page}:${count}`
  const cached = fromMem<Track[]>(key, 30 * 60 * 1000)
  if (cached) return cached
  const raw = await apiGet<RawSearchItem[]>({ types: 'search', source, name: keyword, count, pages: page })
  const list = (Array.isArray(raw) ? raw : []).map(mapSearchItem)
  toMem(key, list)
  return list
}

function mapSearchItem(r: RawSearchItem): Track {
  return {
    id: String(r.id),
    name: r.name,
    artist: r.artist || [],
    album: r.album || '',
    picId: r.pic_id,
    lyricId: r.lyric_id,
    urlId: r.url_id,
    source: r.source,
  }
}

/* ---------------- 播放地址 ---------------- */

interface RawUrl {
  url: string
  br: number
}

export async function getTrackUrl(t: Track): Promise<string> {
  const key = `url:${t.source}:${t.urlId ?? t.id}`
  const cached = fromMem<string>(key, 8 * 60 * 1000) // 签名地址短时效
  if (cached) return cached
  const raw = await apiGet<RawUrl | null>({ types: 'url', source: t.source, id: t.urlId ?? t.id, br: 320 }, 20000)
  const url = raw?.url || ''
  toMem(key, url)
  return url
}

/* ---------------- 封面 ---------------- */

export async function getTrackPic(t: Track, size = 300): Promise<string> {
  if (t.picUrl) return upgradePic(t.picUrl, size)
  const pid = t.picId
  if (!pid) return ''
  const key = `pic:${t.source}:${pid}:${size}`
  const cached = lsRead<string>(key, 30 * 24 * 3600 * 1000)
  if (cached) return cached
  const raw = await apiGet<{ url: string } | null>({ types: 'pic', source: t.source, id: pid, size }, 10000)
  const url = raw?.url || ''
  if (url) lsWrite(key, url)
  return url
}

function upgradePic(url: string, size: number) {
  return url.replace(/^http:/, 'https:').replace(/param=\d+y\d+/, `param=${size}y${size}`)
}

/* ---------------- 歌词 ---------------- */

export interface LyricLine {
  t: number
  text: string
  tr?: string
}

export async function getLyric(t: Track): Promise<{ lines: LyricLine[]; hasTr: boolean }> {
  const key = `lyric:${t.source}:${t.lyricId ?? t.id}`
  const cached = lsRead<{ lines: LyricLine[]; hasTr: boolean }>(key, 7 * 24 * 3600 * 1000)
  if (cached) return cached
  const raw = await apiGet<{ lyric?: string; tlyric?: string } | null>(
    { types: 'lyric', source: t.source, id: t.lyricId ?? t.id },
    12000,
  )
  const lines = parseLrc(raw?.lyric || '', raw?.tlyric || '')
  const out = { lines, hasTr: lines.some((l) => l.tr) }
  if (lines.length) lsWrite(key, out)
  return out
}

function parseLrc(lrc: string, tr: string): LyricLine[] {
  const map = new Map<number, LyricLine>()
  const feed = (text: string, field: 'text' | 'tr') => {
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\](.*)$/)
      if (!m) continue
      const t = parseInt(m[1]) * 60 + parseInt(m[2]) + (m[3] ? parseInt(m[3].padEnd(3, '0')) / 1000 : 0)
      const content = (m[4] || '').trim()
      if (field === 'text' && (!content || /^(作词|作曲|编曲|制作人|录音|混音|和声|吉他|贝斯|鼓|发行|出品|监制|OP|SP)/.test(content)))
        continue // 跳过制作名单与空行
      const item = map.get(t) || { t, text: '' }
      item[field] = content
      map.set(t, item)
    }
  }
  feed(lrc, 'text')
  feed(tr, 'tr')
  return [...map.values()].filter((l) => l.text).sort((a, b) => a.t - b.t)
}

/* ---------------- 歌单 / 榜单 ---------------- */

interface RawNeteaseTrack {
  id: number
  name: string
  ar: { name: string }[]
  al: { name: string; picUrl?: string }
  dt: number
}

interface RawNeteasePlaylist {
  name: string
  coverImgUrl: string
  trackCount: number
  tracks?: RawNeteaseTrack[]
}

export async function getPlaylistDetail(id: string): Promise<PlaylistDetail> {
  const key = `playlist:${id}`
  const cached = fromMem<PlaylistDetail>(key, 6 * 3600 * 1000)
  if (cached) return cached
  const ls = lsRead<PlaylistDetail>(key, 6 * 3600 * 1000)
  if (ls) {
    toMem(key, ls)
    return ls
  }
  const raw = await apiGet<{ playlist?: RawNeteasePlaylist }>(
    { types: 'playlist', source: 'netease', id },
    30000,
  )
  const p = raw.playlist
  if (!p) throw new Error('歌单不存在')
  const detail: PlaylistDetail = {
    id,
    name: p.name,
    cover: (p.coverImgUrl || '').replace(/^http:/, 'https:'),
    count: p.trackCount ?? p.tracks?.length ?? 0,
    tracks: (p.tracks || []).map((t) => ({
      id: String(t.id),
      name: t.name,
      artist: (t.ar || []).map((a) => a.name),
      album: t.al?.name || '',
      picUrl: t.al?.picUrl,
      source: 'netease',
    })),
  }
  toMem(key, detail)
  lsWrite(key, detail)
  return detail
}

/** 精选榜单 / 歌单（网易云官方榜） */
export const CHARTS: ChartMeta[] = [
  { id: '3778678', name: '热歌榜', desc: '全网最热单曲 TOP200', tint: '#FF6B4A' },
  { id: '19723756', name: '飙升榜', desc: '上升最快的宝藏新声', tint: '#147C5A' },
  { id: '3779629', name: '新歌榜', desc: '每日首发新歌速递', tint: '#E8A33D' },
  { id: '10520166', name: '国电榜', desc: '华语电子舞曲能量场', tint: '#3D7BE8' },
  { id: '745956260', name: '韩语榜', desc: 'K-Pop 潮流风向标', tint: '#9A5CE8' },
  { id: '991319536', name: '钢琴曲', desc: '专注·睡眠·放空好伴侣', tint: '#0C5340' },
]

export const HOT_KEYWORDS = ['周杰伦', '林俊杰', '孙燕姿', 'Taylor Swift', '陈绮贞', '五月天', '告五人', 'Eason Chan', 'YOASOBI', '草东没有派对']
