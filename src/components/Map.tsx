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
  onMapMove?: (lng: number, lat: number, radiusKm: number) => void
}

export default function Map({ venues, selectedVenueId, onVenueSelect, center, onMapMove }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<globalThis.Map<string, mapboxgl.Marker>>(new globalThis.Map())
  const initialCenterRef = useRef(center)

  // Effect 1: Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenterRef.current,
      zoom: 14,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }, [])

  // Effect 1b: Reload venues after user-initiated map movement (pan/zoom).
  // Programmatic moves (flyTo/easeTo) are ignored via the originalEvent check.
  const onMapMoveRef = useRef(onMapMove)
  onMapMoveRef.current = onMapMove
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let userMoved = false
    let debounce: ReturnType<typeof setTimeout>

    const onMoveStart = (e: { originalEvent?: Event } | object) => {
      if ('originalEvent' in e && e.originalEvent) userMoved = true
    }
    const onMoveEnd = () => {
      if (!userMoved) return
      userMoved = false
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        const c = map.getCenter()
        const bounds = map.getBounds()
        if (!bounds) return
        // Radius = distance from center to the north edge, capped at 10km
        const ne = bounds.getNorthEast()
        const latKm = Math.abs(ne.lat - c.lat) * 111
        const radiusKm = Math.min(Math.max(latKm, 0.5), 10)
        onMapMoveRef.current?.(c.lng, c.lat, radiusKm)
      }, 400)
    }

    map.on('movestart', onMoveStart)
    map.on('zoomstart', onMoveStart)
    map.on('moveend', onMoveEnd)
    return () => {
      clearTimeout(debounce)
      map.off('movestart', onMoveStart)
      map.off('zoomstart', onMoveStart)
      map.off('moveend', onMoveEnd)
    }
  }, [])

  // Effect 2: Fly to center whenever it changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.flyTo({ center, zoom: 14 })
  }, [center])

  // Effect 3: Add markers with load guard (independent of selection)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function addMarkers() {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = new globalThis.Map()

      venues.forEach(venue => {
        // Outer element: positioned by Mapbox (via transform) — keep it style-free.
        // Inner dot: all visual styling, hover scale, and selection ring.
        const el = document.createElement('div')
        const dot = document.createElement('div')
        dot.className = 'w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125'
        dot.style.backgroundColor = pinColor(venue)
        el.appendChild(dot)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([venue.lng, venue.lat])
          .addTo(map!)

        el.addEventListener('click', () => onVenueSelect(venue))
        markersRef.current.set(venue.id, marker)
      })
    }

    if (map.loaded()) {
      addMarkers()
    } else {
      map.once('load', addMarkers)
    }
  }, [venues, onVenueSelect])

  // Effect 4: Highlight selected marker and centre the map on it
  useEffect(() => {
    // Update highlight ring on all markers
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      const dot = el.firstElementChild as HTMLElement | null
      if (!dot) return
      if (id === selectedVenueId) {
        dot.style.outline = '3px solid #2563eb'
        dot.style.outlineOffset = '2px'
        el.style.zIndex = '10'
      } else {
        dot.style.outline = 'none'
        dot.style.outlineOffset = ''
        el.style.zIndex = ''
      }
    })

    const map = mapRef.current
    if (!map || !selectedVenueId) return
    const venue = venues.find(v => v.id === selectedVenueId)
    if (!venue) return
    map.easeTo({
      center: [venue.lng, venue.lat],
      zoom: Math.max(map.getZoom(), 15),
      duration: 600,
      essential: true,
    })
  }, [selectedVenueId, venues])

  return <div ref={containerRef} className="w-full h-full" />
}
