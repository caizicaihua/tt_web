export interface LoginPayload {
  username: string
  password: string
}

export interface PortalSession {
  user: { id: string; username: string; display_name: string }
  company: { id: string; name: string; company_type: 'internal' | 'external' }
  permissions: string[]
}
