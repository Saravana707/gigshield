export interface User {
  id: string
  email: string
  name?: string
  image?: string
  role?: 'client' | 'freelancer'
  wallet_address?: string
  provider: string
}

export interface Job {
  id: number
  title: string
  description: string
  budget: number
  budget_currency: string
  skills?: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  client_id: string
  freelancer_id?: string
  deadline?: string
  contract_address?: string
  created_at: string
  client?: User
  application_count?: number
}

export interface Application {
  id: number
  job_id: number
  freelancer_id: string
  proposal: string
  bid_amount?: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  freelancer?: User
  job?: Job
}
