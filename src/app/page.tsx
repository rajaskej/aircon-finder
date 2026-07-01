'use client'

import { useState, useEffect, useCallback } from 'react'
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

const DEFAULT_CENTER: [number, number] = [-0.1276, 51.5074] // London
const DEFAULT_FILTERS: Filters = { types: [], wifi: false, workFriendly: false, noPurchaseRequired: false }

export default function Home() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadVenues = useCallback(async (lng: number, lat: number) => {
    setLoading(true)
    const { data, error } = await supabase.rpc('venues_near', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: 2,
      p_limit: 100,
    })
    if (!error && data) setAllVenues(data as Venue[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) { setLocationDenied(true); setLoading(false); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { longitude, latitude } = pos.coords
        setCenter([longitude, latitude])
        loadVenues(longitude, latitude)
      },
      () => { setLocationDenied(true); setLoading(false) }
    )
  }, [loadVenues])

  function handleLocationFound(lng: number, lat: number) {
    setCenter([lng, lat])
    loadVenues(lng, lat)
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
      {locationDenied && (
        <div className="p-3 bg-amber-50 border-b border-amber-200">
          <LocationSearch onLocationFound={handleLocationFound} />
        </div>
      )}
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-gray-100 bg-white shrink-0 z-10">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{loading ? 'Finding venues...' : `${filteredVenues.length} venues nearby`}</span>
            <Link href="/submit" className="text-blue-600 hover:text-blue-800 font-medium">+ Add venue</Link>
          </div>
          <VenueList
            venues={filteredVenues}
            selectedVenueId={selectedVenue?.id ?? null}
            onSelect={v => setSelectedVenue(v)}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            venues={filteredVenues}
            selectedVenueId={selectedVenue?.id ?? null}
            onVenueSelect={v => setSelectedVenue(v)}
            center={center}
          />
          <VenueDetail venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
        </div>
      </div>
    </main>
  )
}
