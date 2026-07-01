'use client'

import { useState } from 'react'

interface Props {
  onLocationFound: (lng: number, lat: number) => void
}

export default function LocationSearch({ onLocationFound }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ place_name: string; center: [number, number] }[]>([])
  const [loading, setLoading] = useState(false)

  async function handleInput(value: string) {
    setQuery(value)
    if (value.length < 3) { setSuggestions([]); return }

    setLoading(true)
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&autocomplete=true&limit=5&bbox=-10,35,30,60`
    const res = await fetch(url)
    const data = await res.json()
    setSuggestions(data.features || [])
    setLoading(false)
  }

  function select(suggestion: { place_name: string; center: [number, number] }) {
    setQuery(suggestion.place_name)
    setSuggestions([])
    onLocationFound(suggestion.center[0], suggestion.center[1])
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        placeholder="Enter an address or place..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <p className="absolute right-3 top-2 text-xs text-gray-400">...</p>}
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => select(s)}
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
