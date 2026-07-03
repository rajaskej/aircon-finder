'use client'

import type { Filters, VenueType } from '@/lib/types'

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'cafe', label: 'Café' },
  { value: 'library', label: 'Library' },
  { value: 'mall', label: 'Mall' },
  { value: 'museum', label: 'Museum' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'community_centre', label: 'Community Centre' },
]

interface Props {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export default function FilterBar({ filters, onFiltersChange }: Props) {
  function toggleType(type: VenueType) {
    const types = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFiltersChange({ ...filters, types })
  }

  function toggle(key: 'wifi' | 'workFriendly' | 'noPurchaseRequired') {
    onFiltersChange({ ...filters, [key]: !filters[key] })
  }

  return (
    <div className="flex flex-nowrap md:flex-wrap overflow-x-auto gap-2 p-3 border-b border-gray-100 bg-white">
      {VENUE_TYPES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => toggleType(value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
            filters.types.includes(value)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          {label}
        </button>
      ))}
      <div className="w-px bg-gray-200 mx-1 shrink-0" />
      {[
        { key: 'wifi' as const, label: 'WiFi' },
        { key: 'workFriendly' as const, label: 'Work-friendly' },
        { key: 'noPurchaseRequired' as const, label: 'No purchase' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
            filters[key]
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
