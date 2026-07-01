'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import LocationSearch from '@/components/LocationSearch'
import type { VenueType } from '@/lib/types'

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'cafe', label: 'Café' },
  { value: 'library', label: 'Library' },
  { value: 'mall', label: 'Shopping Mall' },
  { value: 'museum', label: 'Museum' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'community_centre', label: 'Community Centre' },
]

export default function SubmitVenue() {
  const [name, setName] = useState('')
  const [type, setType] = useState<VenueType>('cafe')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [wifi, setWifi] = useState(false)
  const [workFriendly, setWorkFriendly] = useState(false)
  const [purchaseRequired, setPurchaseRequired] = useState(false)
  const [seating, setSeating] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleLocationFound(lng: number, lat: number) {
    setCoords({ lat, lng })
    // Update address display when location is selected
    setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!coords) {
      setError('Please select an address from the suggestions.')
      return
    }
    setError(null)

    const { error: dbError } = await supabase.from('venues').insert({
      name,
      type,
      lat: coords.lat,
      lng: coords.lng,
      address,
      wifi,
      work_friendly: workFriendly,
      purchase_required: purchaseRequired,
      seating,
      status: 'pending',
    })

    if (dbError) {
      setError('Submission failed. Please try again.')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Thanks!</h1>
        <p className="text-gray-600">Your venue has been submitted for review. We'll add it soon.</p>
        <a href="/" className="mt-6 inline-block text-blue-600 hover:underline text-sm">← Back to map</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6">
      <a href="/" className="text-sm text-blue-600 hover:underline">← Back to map</a>
      <h1 className="text-2xl font-bold mt-4 mb-6">Submit a venue</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue name *</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue type *</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as VenueType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VENUE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <LocationSearch onLocationFound={handleLocationFound} />
          {coords && <p className="text-xs text-green-600 mt-1">Location set ✓</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
          <div className="space-y-2">
            {[
              { state: wifi, setter: setWifi, label: 'Free WiFi' },
              { state: workFriendly, setter: setWorkFriendly, label: 'Work-friendly' },
              { state: purchaseRequired, setter: setPurchaseRequired, label: 'Purchase required to stay' },
              { state: seating, setter: setSeating, label: 'Seating available' },
            ].map(({ state, setter, label }) => (
              <label key={label} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Submit venue
        </button>
      </form>
    </div>
  )
}
