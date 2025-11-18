import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrganizationInvite = Database['public']['Tables']['organization_invites']['Row']
export type Board = Database['public']['Tables']['boards']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type CardActivity = Database['public']['Tables']['card_activities']['Row']

export interface OrganizationWithRole extends Organization {
  role: 'owner' | 'admin' | 'member'
  member_count?: number
}

export interface BoardWithOrg extends Board {
  organization: Organization
}

export interface ListWithCards extends List {
  cards: Card[]
}

export interface CardWithDetails extends Card {
  activities: CardActivity[]
  creator?: Profile
}