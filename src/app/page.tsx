'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import VenueList from '@/components/VenueList'
import FilterBar from '@/components/FilterBar'
import LocationSearch from '@/components/LocationSearch'
import VenueDetail from '@/components/VenueDetail'
import type { Venue, Filters, VenueType } from '@/lib/types'

// Mapbox requires browser APIs — load client-side only
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const DEFAULT_FILTERS: Filters = { types: [], wifi: false, workFriendly: false, noPurchaseRequired: false }

export default function Home() {
  const [center, setCenter] = useState<[number, number] | null>(null)
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showListMobile, setShowListMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const loadVenues = useCallback(async (lng: number, lat: number, radiusKm = 2) => {
    setLoading(true)
    const { data, error } = await supabase.rpc('venues_near', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
      p_limit: 300,
    })
    if (!error && data) setAllVenues(data as Venue[])
    setLoading(false)
  }, [])

  // Map was panned/zoomed by the user: refresh venues for the visible area
  // without re-centering the map (center state stays as-is).
  const handleMapMove = useCallback((lng: number, lat: number, radiusKm: number) => {
    loadVenues(lng, lat, radiusKm)
  }, [loadVenues])

  const handleLocationFound = useCallback((lng: number, lat: number) => {
    setCenter([lng, lat])
    loadVenues(lng, lat)
  }, [loadVenues])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      pos => handleLocationFound(pos.coords.longitude, pos.coords.latitude),
      () => setGeoError('Could not get your location. Try searching for an address instead.')
    )
  }

  // Landing view: shown until a location is set
  if (!center) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-white px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 text-center">
          Air Con Near Me
        </h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Find air-conditioned cafés, libraries, malls and more to escape the heat.
        </p>
        <div className="w-full max-w-lg">
          <LocationSearch onLocationFound={handleLocationFound} />
        </div>
        <button
          onClick={useMyLocation}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          📍 Use my current location
        </button>
        {geoError && <p className="mt-3 text-sm text-red-500">{geoError}</p>}
        <Link href="/submit" className="mt-10 text-xs text-gray-400 hover:text-gray-600">
          Know a cool spot? Add a venue
        </Link>
      </main>
    )
  }

  const filteredVenues = allVenues.filter(v => {
    if (filters.types.length > 0 && !filters.types.includes(v.type as VenueType)) return false
    if (filters.wifi && !v.wifi) return false
    if (filters.workFriendly && !v.work_friendly) return false
    if (filters.noPurchaseRequired && v.purchase_required !== false) return false
    return true
  })

  return (
    <main className="flex flex-col h-screen">
      <div className="p-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <button
          onClick={() => { setCenter(null); setAllVenues([]); setSelectedVenue(null) }}
          className="font-semibold text-gray-900 whitespace-nowrap hover:text-blue-600 text-left"
        >
          Air Con Near Me
        </button>
        <div className="flex-1 sm:max-w-md">
          <LocationSearch onLocationFound={handleLocationFound} />
        </div>
      </div>
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar: static panel on desktop, full-screen overlay on mobile */}
        <div className={`${showListMobile ? 'absolute inset-0 z-30 flex' : 'hidden'} md:static md:flex w-full md:w-80 flex-col border-r border-gray-100 bg-white shrink-0 md:z-10`}>
          <div className="p-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{loading ? 'Finding venues...' : `${filteredVenues.length} venues nearby`}</span>
            <Link href="/submit" className="text-blue-600 hover:text-blue-800 font-medium">+ Add venue</Link>
          </div>
          <VenueList
            venues={filteredVenues}
            selectedVenueId={selectedVenue?.id ?? null}
            onSelect={v => { setSelectedVenue(v); setShowListMobile(false) }}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            venues={filteredVenues}
            selectedVenueId={selectedVenue?.id ?? null}
            onVenueSelect={v => setSelectedVenue(v)}
            center={center}
            onMapMove={handleMapMove}
          />
          <VenueDetail venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
        </div>

        {/* Mobile list/map toggle */}
        <button
          onClick={() => setShowListMobile(v => !v)}
          className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg"
        >
          {showListMobile ? 'Map' : `List (${filteredVenues.length})`}
        </button>
      </div>
    </main>
  )
}
