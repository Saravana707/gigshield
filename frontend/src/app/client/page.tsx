'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Briefcase, Users, CheckCircle2, Clock,
  ChevronRight, Wallet, AlertCircle, TrendingUp
} from 'lucide-react'
import { getPostedJobs, getJobApplications, approveApplication, rejectApplication, completeJob, updateUser } from '@/lib/api'
import { Job, Application, User } from '@/types'
import clsx from 'clsx'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', `badge-${status}`)}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [walletInput, setWalletInput] = useState('')
  const [savingWallet, setSavingWallet] = useState(false)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const userId = (session?.user as any)?.id || session?.user?.email || ''

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getPostedJobs(userId),
      import('@/lib/api').then(m => m.getUser(userId)),
    ]).then(([jobsData, userData]) => {
      setJobs(jobsData)
      setUserProfile(userData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  const loadApplications = async (job: Job) => {
    setSelectedJob(job)
    const apps = await getJobApplications(job.id)
    setApplications(apps)
  }

  const handleApprove = async (appId: number) => {
    if (!selectedJob) return
    setActionLoading(appId)
    try {
      await approveApplication(appId, userId)
      const [updatedJobs, updatedApps] = await Promise.all([
        getPostedJobs(userId),
        getJobApplications(selectedJob.id),
      ])
      setJobs(updatedJobs)
      setApplications(updatedApps)
      setSelectedJob(updatedJobs.find(j => j.id === selectedJob.id) || null)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (appId: number) => {
    if (!selectedJob) return
    setActionLoading(appId)
    try {
      await rejectApplication(appId, userId)
      const apps = await getJobApplications(selectedJob.id)
      setApplications(apps)
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (jobId: number) => {
    setActionLoading(jobId)
    try {
      await completeJob(jobId, userId)
      const updatedJobs = await getPostedJobs(userId)
      setJobs(updatedJobs)
      if (selectedJob?.id === jobId) {
        setSelectedJob(updatedJobs.find(j => j.id === jobId) || null)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveWallet = async () => {
    if (!walletInput.trim()) return
    setSavingWallet(true)
    try {
      const updated = await updateUser(userId, { wallet_address: walletInput.trim() })
      setUserProfile(updated)
      setWalletInput('')
    } finally {
      setSavingWallet(false)
    }
  }

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400">Manage your jobs and applications</p>
        </div>
        <Link
          href="/client/post-job"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: stats.total, icon: <Briefcase className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Open', value: stats.open, icon: <Clock className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'In Progress', value: stats.inProgress, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Wallet section */}
      {!userProfile?.wallet_address ? (
        <div className="glass rounded-2xl p-5 mb-8 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 font-medium mb-1">Add your crypto wallet</p>
              <p className="text-slate-400 text-sm mb-3">Required to fund escrow and release payments to freelancers.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... (Ethereum wallet address)"
                  value={walletInput}
                  onChange={e => setWalletInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveWallet}
                  disabled={savingWallet || !walletInput.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-xl text-sm transition-colors disabled:opacity-40"
                >
                  {savingWallet ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 mb-8 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-400 text-sm font-medium">Wallet connected</p>
            <p className="text-slate-500 text-xs font-mono">{userProfile.wallet_address}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Jobs list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-white font-semibold text-lg mb-4">Your Jobs</h2>
          {jobs.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No jobs posted yet</p>
              <Link
                href="/client/post-job"
                className="text-indigo-400 text-sm hover:text-indigo-300 inline-flex items-center gap-1"
              >
                Post your first job <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                onClick={() => loadApplications(job)}
                className={clsx(
                  'w-full text-left glass rounded-2xl p-5 transition-all hover:border-indigo-500/30',
                  selectedJob?.id === job.id && 'border-indigo-500/40 bg-indigo-500/5'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-medium text-sm leading-tight">{job.title}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="text-indigo-400 font-semibold">{job.budget} {job.budget_currency}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {job.application_count} applicants
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Applications panel */}
        <div className="lg:col-span-3">
          {selectedJob ? (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-white font-bold text-xl mb-1">{selectedJob.title}</h2>
                  <p className="text-slate-400 text-sm">{selectedJob.description.slice(0, 120)}...</p>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              {selectedJob.status === 'in_progress' && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-blue-400 text-sm font-medium mb-2">Job is in progress</p>
                  <p className="text-slate-400 text-xs mb-3">
                    Freelancer: <span className="text-white font-mono text-xs">{selectedJob.freelancer_id}</span>
                  </p>
                  <button
                    onClick={() => handleComplete(selectedJob.id)}
                    disabled={actionLoading === selectedJob.id}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading === selectedJob.id ? 'Processing...' : 'Mark Complete & Release Payment'}
                  </button>
                </div>
              )}

              <h3 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wide">
                Applications ({applications.length})
              </h3>

              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {app.freelancer?.image ? (
                            <img src={app.freelancer.image} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                              {app.freelancer?.name?.[0] || 'F'}
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">{app.freelancer?.name || 'Freelancer'}</p>
                            {app.bid_amount && (
                              <p className="text-emerald-400 text-xs font-semibold">{app.bid_amount} ETH bid</p>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">{app.proposal}</p>
                      {app.status === 'pending' && selectedJob.status === 'open' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={actionLoading === app.id}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                          >
                            {actionLoading === app.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={actionLoading === app.id}
                            className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">Select a job to view applications</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
