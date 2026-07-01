import type { Venue } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  cafe: 'Café',
  library: 'Library',
  mall: 'Mall',
  museum: 'Museum',
  supermarket: 'Supermarket',
  cinema: 'Cinema',
  community_centre: 'Community Centre',
}

function AcBadge({ venue }: { venue: Venue }) {
  if (venue.has_ac === null) return <span className="text-xs text-gray-400">AC unverified</span>
  if (!venue.has_ac) return <span className="text-xs text-red-500">No AC</span>
  const label = {
    confirmed: 'AC confirmed',
    crowdsourced: 'AC confirmed by community',
    inferred: 'AC likely (chain)',
    review_mined: 'AC mentioned in reviews',
  }[venue.ac_confidence ?? 'inferred'] ?? 'Has AC'
  return <span className="text-xs text-green-600 font-medium">{label}</span>
}

interface Props {
  venue: Venue
  selected: boolean
  onClick: () => void
}

export default function VenueCard({ venue, selected, onClick }: Props) {
  const distanceText = venue.distance_m != null
    ? venue.distance_m < 1000
      ? `${Math.round(venue.distance_m)}m`
      : `${(venue.distance_m / 1000).toFixed(1)}km`
    : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{venue.name}</p>
        {distanceText && <span className="text-xs text-gray-400 shrink-0">{distanceText}</span>}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[venue.type] ?? venue.type}</p>
      <div className="mt-1">
        <AcBadge venue={venue} />
      </div>
    </button>
  )
}
