import { defineStore } from 'pinia'
import type { Track } from '../api/listen1'

export interface UserPlaylist {
  id: string
  name: string
  createdAt: number
  tracks: Track[]
}

export interface RecentItem {
  track: Track
  at: number
}

export const trackKey = (t: Track) => `${t.source}:${t.id}`

const LS_KEY = 'ly1:library:v1'

interface LibraryState {
  favorites: Track[]
  recents: RecentItem[]
  playlists: UserPlaylist[]
}

function load(): LibraryState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const d = JSON.parse(raw) as LibraryState
      return { favorites: d.favorites ?? [], recents: d.recents ?? [], playlists: d.playlists ?? [] }
    }
  } catch {
    /* ignore */
  }
  return { favorites: [], recents: [], playlists: [] }
}

let saveTimer: number | undefined

export const useLibrary = defineStore('library', {
  state: (): LibraryState => load(),
  getters: {
    favSet(state): Set<string> {
      return new Set(state.favorites.map(trackKey))
    },
  },
  actions: {
    persist() {
      clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(this.$state))
        } catch {
          /* ignore */
        }
      }, 200)
    },
    isFav(t: Track) {
      return this.favSet.has(trackKey(t))
    },
    toggleFav(t: Track): boolean {
      const k = trackKey(t)
      const idx = this.favorites.findIndex((x) => trackKey(x) === k)
      if (idx >= 0) {
        this.favorites.splice(idx, 1)
        this.persist()
        return false
      }
      this.favorites.unshift(t)
      if (this.favorites.length > 1000) this.favorites.pop()
      this.persist()
      return true
    },
    addRecent(t: Track) {
      const k = trackKey(t)
      const idx = this.recents.findIndex((r) => trackKey(r.track) === k)
      if (idx >= 0) this.recents.splice(idx, 1)
      this.recents.unshift({ track: t, at: Date.now() })
      if (this.recents.length > 200) this.recents.pop()
      this.persist()
    },
    clearRecents() {
      this.recents = []
      this.persist()
    },
    createPlaylist(name: string): UserPlaylist | null {
      const n = name.trim()
      if (!n) return null
      const pl: UserPlaylist = { id: `local-${Date.now().toString(36)}`, name: n, createdAt: Date.now(), tracks: [] }
      this.playlists.unshift(pl)
      this.persist()
      return pl
    },
    deletePlaylist(id: string) {
      this.playlists = this.playlists.filter((p) => p.id !== id)
      this.persist()
    },
    addToPlaylist(id: string, t: Track): 'added' | 'dup' | 'missing' {
      const pl = this.playlists.find((p) => p.id === id)
      if (!pl) return 'missing'
      if (pl.tracks.some((x) => trackKey(x) === trackKey(t))) return 'dup'
      pl.tracks.push(t)
      this.persist()
      return 'added'
    },
    removeFromPlaylist(id: string, t: Track) {
      const pl = this.playlists.find((p) => p.id === id)
      if (!pl) return
      pl.tracks = pl.tracks.filter((x) => trackKey(x) !== trackKey(t))
      this.persist()
    },
  },
})
