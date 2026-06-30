const key = (venueId: string) => `voted_venue_${venueId}`

export function hasVoted(venueId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(key(venueId)) === 'true'
}

export function recordVote(venueId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key(venueId), 'true')
}
