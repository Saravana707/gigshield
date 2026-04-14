import axios from 'axios'
import { Job, Application, User } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

// Users
export const getUser = (userId: string) =>
  api.get<User>(`/users/${userId}`).then(r => r.data)

export const updateUser = (userId: string, data: { role?: string; wallet_address?: string }) =>
  api.put<User>(`/users/${userId}`, data).then(r => r.data)

// Jobs
export const getJobs = (status = 'open') =>
  api.get<Job[]>(`/jobs?status=${status}`).then(r => r.data)

export const getJob = (jobId: number) =>
  api.get<Job>(`/jobs/${jobId}`).then(r => r.data)

export const createJob = (clientId: string, data: {
  title: string
  description: string
  budget: number
  budget_currency?: string
  skills?: string
  deadline?: string
}) =>
  api.post<Job>(`/jobs?client_id=${encodeURIComponent(clientId)}`, data).then(r => r.data)

export const completeJob = (jobId: number, clientId: string) =>
  api.put(`/jobs/${jobId}/complete?client_id=${encodeURIComponent(clientId)}`).then(r => r.data)

export const getPostedJobs = (userId: string) =>
  api.get<Job[]>(`/users/${userId}/posted-jobs`).then(r => r.data)

// Applications
export const getJobApplications = (jobId: number) =>
  api.get<Application[]>(`/jobs/${jobId}/applications`).then(r => r.data)

export const applyForJob = (jobId: number, freelancerId: string, data: {
  proposal: string
  bid_amount?: number
}) =>
  api.post<Application>(
    `/jobs/${jobId}/apply?freelancer_id=${encodeURIComponent(freelancerId)}`,
    data
  ).then(r => r.data)

export const getUserApplications = (userId: string) =>
  api.get<Application[]>(`/users/${userId}/applications`).then(r => r.data)

export const approveApplication = (appId: number, clientId: string) =>
  api.put(`/applications/${appId}/approve?client_id=${encodeURIComponent(clientId)}`).then(r => r.data)

export const rejectApplication = (appId: number, clientId: string) =>
  api.put(`/applications/${appId}/reject?client_id=${encodeURIComponent(clientId)}`).then(r => r.data)
