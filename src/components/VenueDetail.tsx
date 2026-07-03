'use client'

import { useState, useEffect } from 'react'
import type { Venue } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { hasVoted, recordVote } from '@/lib/votes'

const TYPE_LABELS: Record<string, string> = {
  cafe: 'Café', library: 'Library', mall: 'Mall', museum: 'Museum',
  supermarket: 'Supermarket', cinema: 'Cinema', community_centre: 'Community Centre',
}

function AcStatusBadge({ venue }: { venue: Venue }) {
  const configs = {
    confirmed:    { label: 'Confirmed AC', bg: 'bg-green-100', text: 'text-green-800' },
    crowdsourced: { label: 'AC confirmed by community', bg: 'bg-green-100', text: 'text-green-800' },
    inferred:     { label: 'Likely has AC — major chain', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    review_mined: { label: 'AC mentioned in reviews', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  }
  if (venue.has_ac === null) {
    return <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">AC status unverified</span>
  }
  if (!venue.has_ac) {
    return <span className="inline-block px-2 py-1 rounded text-xs bg-red-100 text-red-700">No air conditioning</span>
  }
  const cfg = configs[venue.ac_confidence ?? 'inferred']
  return <span className={`inline-block px-2 py-1 rounded text-xs ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
}

function Chip({ label }: { label: string }) {
  return <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{label}</span>
}

interface Props {
  venue: Venue | null
  onClose: () => void
}

export default function VenueDetail({ venue, onClose }: Props) {
  const [voted, setVoted] = useState(false)
  const [voteSubmitting, setVoteSubmitting] = useState(false)

  useEffect(() => {
    if (venue) setVoted(hasVoted(venue.id))
  }, [venue])

  if (!venue) return null

  async function submitVote(choice: 'yes' | 'no') {
    if (!venue || voted || voteSubmitting) return
    setVoteSubmitting(true)
    await supabase.from('ac_votes').insert({ venue_id: venue.id, vote: choice })
    recordVote(venue.id)
    setVoted(true)
    setVoteSubmitting(false)
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ' ' + (venue.address ?? ''))}`

  return (
    <div className="absolute z-20 bg-white shadow-xl flex flex-col overflow-y-auto inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl md:inset-x-auto md:inset-y-0 md:left-0 md:w-80 md:max-h-none md:rounded-none">
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">{venue.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[venue.type] ?? venue.type}</p>
          {venue.address && <p className="text-xs text-gray-400 mt-0.5">{venue.address}</p>}
        </div>
        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="p-4 space-y-4">
        <AcStatusBadge venue={venue} />

        <div className="flex flex-wrap gap-2">
          {venue.wifi && <Chip label="WiFi available" />}
          {venue.work_friendly && <Chip label="Work-friendly" />}
          {venue.purchase_required === false && <Chip label="No purchase required" />}
          {venue.seating && <Chip label="Seating available" />}
          {venue.time_limit_minutes != null && <Chip label={`${venue.time_limit_minutes} min limit`} />}
        </div>

        <div className="border-t border-gray-100 pt-4">
          {voted ? (
            <p className="text-xs text-gray-400">Thanks for your contribution!</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 mb-2">Does this place have AC?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => submitVote('yes')}
                  disabled={voteSubmitting}
                  className="flex-1 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-200 hover:bg-green-100 disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  onClick={() => submitVote('no')}
                  disabled={voteSubmitting}
                  className="flex-1 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200 hover:bg-red-100 disabled:opacity-50"
                >
                  No
                </button>
              </div>
            </>
          )}
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-blue-600 hover:underline py-2"
        >
          Get directions →
        </a>
      </div>
    </div>
  )
}
