'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { searchTracks, setActiveTrack } from '@/actions/tracks'
import type { ItunesResult } from '@/lib/itunes'
import { Spinner } from '@/components/Spinner'

const PAGE_SIZE = 10
const MAX_RESULTS = 50

export default function TrackSearchForm() {
  const [itemType, setItemType] = useState<'song' | 'album'>('song')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ItunesResult[]>([])
  const [limit, setLimit] = useState(PAGE_SIZE)
  // The query string that produced the current results — guards "Show more"
  // against the user editing the input after searching
  const [searchedQuery, setSearchedQuery] = useState('')
  const [selected, setSelected] = useState<ItunesResult | null>(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setSearchError('')
    setResults([])
    setSelected(null)
    setLimit(PAGE_SIZE)

    const res = await searchTracks(query, itemType, PAGE_SIZE)

    if (res.error) {
      setSearchError(res.error)
    } else {
      setResults(res.results ?? [])
      setSearchedQuery(query)
    }
    setSearching(false)
  }

  async function handleShowMore() {
    const newLimit = Math.min(limit + PAGE_SIZE, MAX_RESULTS)
    setLoadingMore(true)
    const res = await searchTracks(searchedQuery, itemType, newLimit)
    if (res.results) {
      setResults(res.results)
      setLimit(newLimit)
    }
    setLoadingMore(false)
  }

  // iTunes returned a full page → likely more available. If it returned fewer
  // than requested, we've hit the end.
  const canLoadMore = results.length >= limit && limit < MAX_RESULTS

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
        <button type="submit" disabled={searching} className="font-bold text-sm disabled:opacity-50 py-2 shrink-0 flex items-center gap-1.5">
          {searching && <Spinner />}
          {searching ? 'Searching' : 'Search'}
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
          {canLoadMore && (
            <button
              onClick={handleShowMore}
              disabled={loadingMore}
              className="text-sm font-bold self-start py-2 mt-1 disabled:opacity-50 transition-opacity hover:opacity-60 flex items-center gap-1.5"
            >
              {loadingMore && <Spinner />}
              {loadingMore ? 'Loading' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {selected && (
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="font-bold text-sm disabled:opacity-50 py-2 flex items-center gap-1.5"
        >
          {confirming && <Spinner />}
          {confirming ? 'Setting' : `Set "${selected.trackName}"`}
        </button>
      )}
    </section>
  )
}
