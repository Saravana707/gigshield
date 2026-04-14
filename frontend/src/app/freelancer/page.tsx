'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search, Briefcase, CheckCircle2, Clock, Wallet,
  AlertCircle, TrendingUp, ArrowRight
} from 'lucide-react'
import { getUserApplications, getJobs, updateUser } from '@/lib/api'
import { Application, Job, User } from '@/types'
import clsx from 'clsx'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', `badge-${status}`)}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function FreelancerDashboard() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [walletInput, setWalletInput] = useState('')
  const [savingWallet, setSavingWallet] = useState(false)
  const [userProfile, setUserProfile] = useState<User | null>(null)

  const userId = (session?.user as any)?.id || session?.user?.email || ''

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getUserApplications(userId),
      getJobs('in_progress'),
      import('@/lib/api').then(m => m.getUser(userId)),
    ]).then(([apps, inProgressJobs, profile]) => {
      setApplications(apps)
      setActiveJobs(inProgressJobs.filter(j => j.freelancer_id === userId))
      setUserProfile(profile)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

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
    active: activeJobs.length,
    applied: applications.length,
    approved: applications.filter(a => a.status === 'approved').length,
    pending: applications.filter(a => a.status === 'pending').length,
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
            Hey, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400">Track your gigs and find new work</p>
        </div>
        <Link
          href="/freelancer/jobs"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
        >
          <Search className="w-5 h-5" />
          Browse Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Gigs', value: stats.active, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Applied', value: stats.applied, icon: <Briefcase className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Pending', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Approved', value: stats.approved, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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

      {/* Wallet */}
      {!userProfile?.wallet_address ? (
        <div className="glass rounded-2xl p-5 mb-8 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 font-medium mb-1">Add your crypto wallet to receive payments</p>
              <p className="text-slate-400 text-sm mb-3">Clients will send payment to this address when a job is completed.</p>
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
            <p className="text-emerald-400 text-sm font-medium">Payment wallet connected</p>
            <p className="text-slate-500 text-xs font-mono">{userProfile.wallet_address}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Gigs */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Active Gigs</h2>
          {activeJobs.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-3 text-sm">No active gigs yet</p>
              <Link href="/freelancer/jobs" className="text-indigo-400 text-sm hover:text-indigo-300 inline-flex items-center gap-1">
                Find a job <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block glass rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">{job.title}</h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-indigo-400 font-semibold text-sm">{job.budget} {job.budget_currency}</p>
                  {job.deadline && (
                    <p className="text-slate-500 text-xs mt-1">Due: {job.deadline}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Applications */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">My Applications</h2>
          {applications.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-3 text-sm">No applications yet</p>
              <Link href="/freelancer/jobs" className="text-indigo-400 text-sm hover:text-indigo-300 inline-flex items-center gap-1">
                Browse open jobs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <Link key={app.id} href={`/jobs/${app.job_id}`} className="block glass rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white text-sm font-medium">Job #{app.job_id}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">{app.proposal}</p>
                  {app.bid_amount && (
                    <p className="text-emerald-400 text-xs font-semibold mt-2">Bid: {app.bid_amount} ETH</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
