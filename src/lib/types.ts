export type VenueType = 'cafe' | 'library' | 'mall' | 'museum' | 'supermarket' | 'cinema' | 'community_centre'
export type AcConfidence = 'inferred' | 'review_mined' | 'crowdsourced' | 'confirmed'

export interface Venue {
  id: string
  name: string
  type: VenueType
  lat: number
  lng: number
  address: string | null
  city: string | null
  country: string | null
  has_ac: boolean | null
  ac_confidence: AcConfidence | null
  brand: string | null
  wifi: boolean | null
  purchase_required: boolean | null
  time_limit_minutes: number | null
  seating: boolean | null
  work_friendly: boolean | null
  opening_hours: Record<string, string> | null
  distance_m?: number
}

export interface Filters {
  types: VenueType[]
  wifi: boolean
  workFriendly: boolean
  noPurchaseRequired: boolean
}
