import VenueCard from './VenueCard'
import type { Venue } from '@/lib/types'

interface Props {
  venues: Venue[]
  selectedVenueId: string | null
  onSelect: (venue: Venue) => void
}

export default function VenueList({ venues, selectedVenueId, onSelect }: Props) {
  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
        <p>No venues found nearby.</p>
        <p className="mt-1 text-xs">Try expanding your search area or adjusting filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto flex-1">
      {venues.map(venue => (
        <VenueCard
          key={venue.id}
          venue={venue}
          selected={venue.id === selectedVenueId}
          onClick={() => onSelect(venue)}
        />
      ))}
    </div>
  )
}
