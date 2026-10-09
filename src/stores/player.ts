import { defineStore } from 'pinia'
import { getLyric, getTrackUrl, type LyricLine, type Track } from '../api/listen1'
import { useLibrary, trackKey } from './library'
import { toast } from '../utils/emitter'

export type PlayMode = 'order' | 'shuffle' | 'loop'

const LS_PLAYER = 'ly1:player:v1'

interface PlayerState {
  queue: Track[]
  index: number
  playing: boolean
  loading: boolean
  mode: PlayMode
  volume: number
  currentTime: number
  duration: number
  lyric: LyricLine[]
  lyricTr: boolean
  url: string
  muted: boolean
}

let audio: HTMLAudioElement | null = null
let skipStreak = 0
let loadToken = 0

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'auto'
  audio.crossOrigin = 'anonymous'
  return audio
}

export const usePlayer = defineStore('player', {
  state: (): PlayerState => {
    let restored: Partial<PlayerState> = {}
    try {
      restored = JSON.parse(localStorage.getItem(LS_PLAYER) || '{}')
    } catch {
      /* ignore */
    }
    return {
      queue: restored.queue ?? [],
      index: restored.index ?? 0,
      playing: false,
      loading: false,
      mode: restored.mode === 'shuffle' || restored.mode === 'loop' ? restored.mode : 'order',
      volume: typeof restored.volume === 'number' ? restored.volume : 0.9,
      currentTime: 0,
      duration: 0,
      lyric: [],
      lyricTr: false,
      url: '',
      muted: false,
    }
  },
  getters: {
    current(state): Track | null {
      return state.queue[state.index] ?? null
    },
  },
  actions: {
    persist() {
      try {
        const { queue, index, mode, volume } = this
        localStorage.setItem(LS_PLAYER, JSON.stringify({ queue: queue.slice(0, 100), index, mode, volume }))
      } catch {
        /* ignore */
      }
    },

    /** 播放一个曲目列表并跳到指定位置 */
    playQueue(tracks: Track[], startIndex = 0) {
      if (!tracks.length) return
      this.queue = tracks.slice()
      this.index = Math.max(0, Math.min(startIndex, tracks.length - 1))
      this.loadAndPlay()
    },

    /** 插播单曲：已在队列则跳转，否则插入当前曲目之后 */
    playTrack(t: Track) {
      const k = trackKey(t)
      const idx = this.queue.findIndex((x) => trackKey(x) === k)
      if (idx >= 0) {
        this.index = idx
      } else {
        this.queue.splice(this.index + 1, 0, t)
        this.index = this.index + 1
      }
      this.loadAndPlay()
    },

    /** 追加到队列尾部 */
    enqueue(t: Track) {
      this.queue.push(t)
      this.persist()
    },

    async loadAndPlay() {
      const t = this.current
      if (!t || !audio) return
      const token = ++loadToken
      this.loading = true
      this.playing = false
      this.currentTime = 0
      this.duration = 0
      this.url = ''
      this.lyric = []
      this.lyricTr = false
      this.persist()
      useLibrary().addRecent(t)
      this.updateMediaSession(t)

      // 歌词异步加载（不阻塞播放）
      getLyric(t)
        .then((r) => {
          if (token === loadToken) {
            this.lyric = r.lines
            this.lyricTr = r.hasTr
          }
        })
        .catch(() => {})

      try {
        const url = await getTrackUrl(t)
        if (token !== loadToken) return
        if (!url) {
          toast(`《${t.name}» 暂无播放链接，自动切换下一首`, 'error')
          this.advance(1)
          return
        }
        this.url = url
        audio.src = url
        audio.volume = this.muted ? 0 : this.volume
        await audio.play()
        skipStreak = 0
        this.playing = true
        this.loading = false
      } catch (err) {
        if (token !== loadToken) return
        this.loading = false
        const msg = err instanceof Error ? err.message : String(err)
        toast(`播放失败（${msg}），尝试下一首`, 'error')
        skipStreak += 1
        if (skipStreak < 5) this.advance(1)
      }
    },

    toggle() {
      if (!audio || !this.current) return
      if (audio.paused) {
        if (!this.url) {
          this.loadAndPlay()
          return
        }
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
    },

    setMode() {
      this.mode = this.mode === 'order' ? 'shuffle' : this.mode === 'shuffle' ? 'loop' : 'order'
      const label = { order: '顺序播放', shuffle: '随机播放', loop: '单曲循环' }[this.mode]
      toast(label)
      this.persist()
    },

    advance(dir: 1 | -1) {
      if (!this.queue.length) return
      if (this.mode === 'shuffle' && this.queue.length > 1) {
        let next = this.index
        while (next === this.index) next = Math.floor(Math.random() * this.queue.length)
        this.index = next
      } else {
        this.index += dir
        if (this.index >= this.queue.length) this.index = 0
        if (this.index < 0) this.index = this.queue.length - 1
      }
      this.loadAndPlay()
    },

    next() {
      this.advance(1)
    },
    prev() {
      this.advance(-1)
    },

    seek(sec: number) {
      if (!audio) return
      audio.currentTime = sec
      this.currentTime = sec
    },

    setVolume(v: number) {
      this.volume = Math.max(0, Math.min(1, v))
      if (audio && !this.muted) audio.volume = this.volume
      this.persist()
    },

    toggleMute() {
      this.muted = !this.muted
      if (audio) audio.volume = this.muted ? 0 : this.volume
    },

    bindAudio() {
      const a = ensureAudio()
      a.addEventListener('timeupdate', () => {
        this.currentTime = a.currentTime
      })
      a.addEventListener('durationchange', () => {
        this.duration = a.duration || 0
      })
      a.addEventListener('play', () => {
        this.playing = true
      })
      a.addEventListener('pause', () => {
        this.playing = false
      })
      a.addEventListener('ended', () => {
        if (this.mode === 'loop') {
          a.currentTime = 0
          a.play().catch(() => {})
        } else {
          this.advance(1)
        }
      })
      a.addEventListener('error', () => {
        if (!this.current) return
        skipStreak += 1
        if (skipStreak < 5) {
          toast('音频加载失败，自动切换下一首', 'error')
          this.advance(1)
        }
      })
      // 系统媒体键 / 锁屏控制
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => this.toggle())
        navigator.mediaSession.setActionHandler('pause', () => this.toggle())
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev())
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next())
      }
    },

    updateMediaSession(t: Track) {
      if (!('mediaSession' in navigator)) return
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.name,
        artist: t.artist.join(' / '),
        album: t.album,
        artwork: t.picUrl ? [{ src: t.picUrl.replace(/^http:/, 'https:'), sizes: '300x300' }] : [],
      })
    },
  },
})
