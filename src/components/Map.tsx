'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Venue } from '@/lib/types'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

function pinColor(venue: Venue): string {
  if (venue.has_ac === null) return '#9ca3af'                          // grey
  if (!venue.has_ac) return '#ef4444'                                  // red = confirmed no AC
  if (venue.ac_confidence === 'crowdsourced' || venue.ac_confidence === 'confirmed') return '#22c55e' // green
  return '#eab308'                                                     // yellow = inferred/review_mined
}

interface MapProps {
  venues: Venue[]
  selectedVenueId: string | null
  onVenueSelect: (venue: Venue) => void
  center: [number, number]  // [lng, lat]
}

export default function Map({ venues, selectedVenueId, onVenueSelect, center }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 14,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }, [center])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    venues.forEach(venue => {
      const el = document.createElement('div')
      el.className = 'w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125'
      el.style.backgroundColor = pinColor(venue)
      if (venue.id === selectedVenueId) {
        el.style.transform = 'scale(1.4)'
        el.style.zIndex = '10'
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([venue.lng, venue.lat])
        .addTo(map)

      el.addEventListener('click', () => onVenueSelect(venue))
      markersRef.current.push(marker)
    })
  }, [venues, selectedVenueId, onVenueSelect])

  return <div ref={containerRef} className="w-full h-full" />
}
