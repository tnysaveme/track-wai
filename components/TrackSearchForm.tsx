'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { searchTracks, setActiveTrack } from '@/actions/tracks'
import type { ItunesResult } from '@/lib/itunes'

export default function TrackSearchForm() {
  const [itemType, setItemType] = useState<'song' | 'album'>('song')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ItunesResult[]>([])
  const [selected, setSelected] = useState<ItunesResult | null>(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setSearchError('')
    setResults([])
    setSelected(null)

    const res = await searchTracks(query, itemType)

    if (res.error) {
      setSearchError(res.error)
    } else {
      setResults(res.results ?? [])
    }
    setSearching(false)
  }

  async function handleConfirm() {
    if (!selected) return
    setConfirming(true)
    setSearchError('')

    const result = await setActiveTrack(selected, itemType, query)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Now featuring: ${selected.artistName} — ${selected.trackName}`)
      setQuery('')
      setResults([])
      setSelected(null)
    }
    setConfirming(false)
  }

  return (
    <section className="mb-10">
      <h2 className="font-bold text-lg mb-4">Set New Track</h2>

      <div className="flex gap-4 mb-4">
        {(['song', 'album'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setItemType(t)
              setResults([])
              setSelected(null)
              setSearchError('')
            }}
            className={`text-sm font-bold pb-0.5 ${
              itemType === t ? 'border-b-2 border-black' : 'text-gray-400'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search for a ${itemType}...`}
          required
          className="border-b border-black outline-none py-2 text-base flex-1"
        />
        <button type="submit" disabled={searching} className="font-bold text-sm disabled:opacity-50 py-2 shrink-0">
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchError && <p className="text-sm text-red-600 mb-3">{searchError}</p>}

      {results.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {results.map((r, i) => (
            <button
              key={r.stableId}
              onClick={() => setSelected(r)}
              className={`result-enter flex items-center gap-3 p-3 text-left border transition-colors w-full ${
                selected === r ? 'border-black' : 'border-transparent hov:border-gray-200'
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Image src={r.artworkUrl} alt={r.trackName} width={48} height={48} className="object-cover shrink-0" sizes="48px" />
              <div>
                <p className="text-sm font-bold">{r.artistName}</p>
                <p className="text-sm">{r.trackName}</p>
                {!r.previewUrl && itemType === 'song' && (
                  <p className="text-xs text-gray-400">No preview available</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="font-bold text-sm disabled:opacity-50 py-2"
        >
          {confirming ? 'Setting...' : `Set "${selected.trackName}"`}
        </button>
      )}
    </section>
  )
}
