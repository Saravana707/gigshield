'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Users, Wallet, CheckCircle2,
  DollarSign, AlertCircle, Send
} from 'lucide-react'
import { getJob, applyForJob, getUser } from '@/lib/api'
import { Job, User } from '@/types'
import clsx from 'clsx'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-3 py-1.5 rounded-full text-sm font-medium', `badge-${status}`)}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function JobDetail() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const jobId = parseInt(params.id as string)

  const [job, setJob] = useState<Job | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposal, setProposal] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')

  const userId = (session?.user as any)?.id || session?.user?.email || ''

  useEffect(() => {
    if (!jobId || !userId) return
    Promise.all([getJob(jobId), getUser(userId)]).then(([jobData, profile]) => {
      setJob(jobData)
      setUserProfile(profile)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [jobId, userId])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposal.trim()) {
      setError('Please write a proposal.')
      return
    }
    setApplying(true)
    setError('')
    try {
      await applyForJob(jobId, userId, {
        proposal,
        bid_amount: bidAmount ? parseFloat(bidAmount) : undefined,
      })
      setApplied(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to apply. You may have already applied.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-slate-400">Job not found.</p>
        <Link href="/freelancer/jobs" className="text-indigo-400 hover:underline mt-2 inline-block">← Back to jobs</Link>
      </div>
    )
  }

  const isFreelancer = userProfile?.role === 'freelancer'
  const isClient = userProfile?.role === 'client'
  const isOwner = job.client_id === userId

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href={isClient ? '/client' : '/freelancer/jobs'}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {isClient ? 'Back to Dashboard' : 'Back to Jobs'}
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Job details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold text-white leading-tight">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>

            <p className="text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">{job.description}</p>

            {job.skills && (
              <div className="mb-6">
                <p className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wide">Skills Required</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Budget</p>
                <p className="text-indigo-400 font-bold text-xl">{job.budget} {job.budget_currency}</p>
              </div>
              {job.deadline && (
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Deadline</p>
                  <p className="text-white font-medium">{job.deadline}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Posted by</p>
                <div className="flex items-center gap-2">
                  {job.client?.image ? (
                    <img src={job.client.image} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                  )}
                  <span className="text-white text-sm">{job.client?.name || 'Client'}</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Posted</p>
                <p className="text-white text-sm">
                  {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Apply / Status sidebar */}
        <div className="space-y-4">
          {/* Freelancer apply form */}
          {isFreelancer && job.status === 'open' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4">Apply for this job</h2>

              {!userProfile?.wallet_address && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs">
                    Add your wallet address in the dashboard to receive payment if hired.
                  </p>
                </div>
              )}

              {applied ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-emerald-400 font-medium">Application submitted!</p>
                  <p className="text-slate-500 text-sm mt-1">The client will review your proposal.</p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Your Proposal</label>
                    <textarea
                      value={proposal}
                      onChange={e => setProposal(e.target.value)}
                      placeholder="Describe your experience, approach, and why you're the best fit..."
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Your Bid ({job.budget_currency})
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        placeholder={`${job.budget} (client's budget)`}
                        min="0"
                        step="0.001"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40"
                  >
                    {applying ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Status info for non-open jobs */}
          {job.status !== 'open' && (
            <div className="glass rounded-2xl p-6">
              <div className="text-center">
                <StatusBadge status={job.status} />
                <p className="text-slate-400 text-sm mt-3">
                  {job.status === 'in_progress' && 'This job is currently in progress.'}
                  {job.status === 'completed' && 'This job has been completed.'}
                  {job.status === 'cancelled' && 'This job was cancelled.'}
                </p>
              </div>
            </div>
          )}

          {/* Wallet info */}
          {isFreelancer && userProfile?.wallet_address && (
            <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <p className="text-emerald-400 text-sm font-medium">Payment wallet</p>
              </div>
              <p className="text-slate-500 text-xs font-mono truncate">{userProfile.wallet_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
