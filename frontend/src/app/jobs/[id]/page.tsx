'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Users, Wallet, CheckCircle2,
  DollarSign, AlertCircle, Send, Zap, Play, Flag
} from 'lucide-react'
import { getJob, applyForJob, getUser } from '@/lib/api'
import {
  startWork, submitMilestone, getEscrowInfo,
  EscrowStatus, STATUS_LABELS
} from '@/lib/contract'
import { Job, User } from '@/types'
import clsx from 'clsx'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-3 py-1.5 rounded-full text-sm font-medium', `badge-${status}`)}>
      {status.replace('_', ' ')}
    </span>
  )
}

function EscrowPanel({ contractAddress, freelancerId, userId, role }: {
  contractAddress: string
  freelancerId: string
  userId: string
  role?: string
}) {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getEscrowInfo>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [txStatus, setTxStatus] = useState('')

  const reload = async () => {
    try {
      const i = await getEscrowInfo(contractAddress)
      setInfo(i)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { reload() }, [contractAddress])

  const isFreelancer = role === 'freelancer' && userId === freelancerId

  const handleStartWork = async () => {
    setTxLoading(true)
    setTxStatus('Starting work on-chain... (confirm in MetaMask)')
    try {
      await startWork(contractAddress)
      await reload()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setTxLoading(false)
      setTxStatus('')
    }
  }

  const handleSubmitMilestone = async () => {
    setTxLoading(true)
    setTxStatus('Submitting milestone for review... (confirm in MetaMask)')
    try {
      await submitMilestone(contractAddress)
      await reload()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setTxLoading(false)
      setTxStatus('')
    }
  }

  const statusColors: Record<number, string> = {
    0: 'border-slate-500/20 bg-slate-500/5',
    1: 'border-blue-500/20 bg-blue-500/5',
    2: 'border-indigo-500/20 bg-indigo-500/5',
    3: 'border-amber-500/20 bg-amber-500/5',
    4: 'border-red-500/20 bg-red-500/5',
    5: 'border-emerald-500/20 bg-emerald-500/5',
    6: 'border-slate-500/20 bg-slate-500/5',
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!info) return null

  return (
    <div className={clsx('rounded-2xl p-6 border', statusColors[info.status] || 'border-white/10 bg-white/5')}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-bold text-sm">⛓ Escrow Contract</p>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10">
          {STATUS_LABELS[info.status]}
        </span>
      </div>

      <p className="text-slate-500 text-xs font-mono mb-4 break-all">{contractAddress}</p>

      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
        <div>
          <p className="text-slate-500 text-xs mb-1">Locked</p>
          <p className="text-white font-bold">{info.totalAmount} ETH</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Balance</p>
          <p className="text-white font-bold">{info.balance} ETH</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Milestones</p>
          <p className="text-white font-bold">{info.milestonesCompleted}/{info.milestoneCount}</p>
        </div>
      </div>

      {txStatus && (
        <div className="flex items-center gap-2 text-indigo-400 text-xs bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 mb-3">
          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
          {txStatus}
        </div>
      )}

      {/* Freelancer actions */}
      {isFreelancer && (
        <>
          {info.status === EscrowStatus.FUNDED && (
            <button
              onClick={handleStartWork}
              disabled={txLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              <Play className="w-4 h-4" />
              {txLoading ? 'Confirming...' : 'Start Work'}
            </button>
          )}
          {info.status === EscrowStatus.IN_PROGRESS && (
            <button
              onClick={handleSubmitMilestone}
              disabled={txLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              <Flag className="w-4 h-4" />
              {txLoading ? 'Confirming...' : 'Submit Milestone for Review'}
            </button>
          )}
          {info.status === EscrowStatus.MILESTONE_REVIEW && (
            <p className="text-amber-400 text-sm text-center font-medium py-2">
              ⏳ Waiting for client to approve your milestone...
            </p>
          )}
          {info.status === EscrowStatus.AWAITING_PAYMENT && (
            <p className="text-slate-400 text-sm text-center py-2">
              ⏳ Waiting for client to fund the escrow...
            </p>
          )}
          {info.status === EscrowStatus.COMPLETED && (
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-semibold text-sm">Payment released to your wallet!</p>
              <p className="text-slate-500 text-xs mt-1">{info.totalAmount} ETH sent</p>
            </div>
          )}
        </>
      )}

      {/* Client notice */}
      {!isFreelancer && (
        <>
          {info.status === EscrowStatus.MILESTONE_REVIEW && (
            <p className="text-amber-400 text-sm font-medium">
              ⚡ Freelancer submitted a milestone — go to your dashboard to approve and release payment.
            </p>
          )}
          {info.status === EscrowStatus.FUNDED && (
            <p className="text-blue-400 text-sm">Escrow funded. Waiting for freelancer to start work.</p>
          )}
          {info.status === EscrowStatus.IN_PROGRESS && (
            <p className="text-indigo-400 text-sm">Work in progress. Waiting for freelancer to submit a milestone.</p>
          )}
          {info.status === EscrowStatus.COMPLETED && (
            <p className="text-emerald-400 text-sm font-medium">✓ Job complete. Payment released.</p>
          )}
        </>
      )}
    </div>
  )
}

export default function JobDetail() {
  const { data: session } = useSession()
  const params = useParams()
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
    if (!proposal.trim()) { setError('Please write a proposal.'); return }
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
  const isHiredFreelancer = job.freelancer_id === userId
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
                  {job.client?.image && <img src={job.client.image} alt="" className="w-5 h-5 rounded-full" />}
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Escrow panel — shown when contract is deployed */}
          {job.contract_address && (
            <EscrowPanel
              contractAddress={job.contract_address}
              freelancerId={job.freelancer_id || ''}
              userId={userId}
              role={userProfile?.role}
            />
          )}

          {/* Freelancer apply form */}
          {isFreelancer && job.status === 'open' && !isHiredFreelancer && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4">Apply for this job</h2>
              {!userProfile?.wallet_address && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs">Add your wallet in the dashboard to receive payment if hired.</p>
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
                      placeholder="Describe your experience and why you're the best fit..."
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Your Bid ({job.budget_currency})</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        placeholder={`${job.budget}`}
                        min="0" step="0.001"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all disabled:opacity-40"
                  >
                    {applying ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Submit Application</>}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Wallet info */}
          {isFreelancer && userProfile?.wallet_address && (
            <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <p className="text-emerald-400 text-sm font-medium">Your payment wallet</p>
              </div>
              <p className="text-slate-500 text-xs font-mono truncate">{userProfile.wallet_address}</p>
            </div>
          )}

          {/* Job closed notice */}
          {job.status !== 'open' && !job.contract_address && (
            <div className="glass rounded-2xl p-6 text-center">
              <StatusBadge status={job.status} />
              <p className="text-slate-400 text-sm mt-3">
                {job.status === 'in_progress' && 'This job is in progress.'}
                {job.status === 'completed' && 'This job has been completed.'}
                {job.status === 'cancelled' && 'This job was cancelled.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
