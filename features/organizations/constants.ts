/** Default pipeline for a new organization (English labels; UI remains translatable). */
export const DEFAULT_OPPORTUNITY_STAGES = [
  { name: 'Prospecting', position: 0, probability: 10, color: '#6366f1', is_closed_won: false, is_closed_lost: false },
  { name: 'Qualification', position: 1, probability: 25, color: '#0ea5e9', is_closed_won: false, is_closed_lost: false },
  { name: 'Proposal', position: 2, probability: 50, color: '#f59e0b', is_closed_won: false, is_closed_lost: false },
  { name: 'Negotiation', position: 3, probability: 75, color: '#8b5cf6', is_closed_won: false, is_closed_lost: false },
  { name: 'Closed Won', position: 4, probability: 100, color: '#2E8B57', is_closed_won: true, is_closed_lost: false },
  { name: 'Closed Lost', position: 5, probability: 0, color: '#C93C37', is_closed_won: false, is_closed_lost: true },
] as const

export function slugifyOrgName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'org'
}
