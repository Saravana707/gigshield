'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Briefcase, Users, CheckCircle2, Clock,
  ChevronRight, Wallet, AlertCircle, TrendingUp, ExternalLink
} from 'lucide-react'
import {
  getPostedJobs, getJobApplications, approveApplication,
  rejectApplication, completeJob, setJobContractAddress, getUser
} from '@/lib/api'
import {
  deployEscrow, fundEscrow, approveMilestone as approveEscrowMilestone,
  getEscrowInfo, EscrowStatus, STATUS_LABELS
} from '@/lib/contract'
import { Job, Application, User } from '@/types'
import clsx from 'clsx'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', `badge-${status}`)}>
      {status.replace('_', ' ')}
    </span>
  )
}

function EscrowBadge({ status }: { status: number }) {
  const colors: Record<number, string> = {
    0: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    2: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    3: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    4: 'bg-red-500/10 text-red-400 border-red-500/20',
    5: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    6: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium border', colors[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [escrowInfo, setEscrowInfo] = useState<Awaited<ReturnType<typeof getEscrowInfo>> | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [showFundModal, setShowFundModal] = useState(false)
  const [pendingContractAddress, setPendingContractAddress] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState('')

  const userId = (session?.user as any)?.id || session?.user?.email || ''

  const reloadJobs = async () => {
    const j = await getPostedJobs(userId)
    setJobs(j)
    return j
  }

  useEffect(() => {
    if (!userId) return
    Promise.all([reloadJobs(), getUser(userId)])
      .then(([, profile]) => { setUserProfile(profile); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  const loadApplications = async (job: Job) => {
    setSelectedJob(job)
    setEscrowInfo(null)
    const apps = await getJobApplications(job.id)
    setApplications(apps)
    if (job.contract_address) {
      try {
        const info = await getEscrowInfo(job.contract_address)
        setEscrowInfo(info)
      } catch {}
    }
  }

  // Step 1: Client approves application → deploy contract
  const handleApprove = async (app: Application) => {
    if (!selectedJob || !userProfile?.wallet_address) return
    const freelancerProfile = await getUser(app.freelancer_id).catch(() => null)
    if (!freelancerProfile?.wallet_address) {
      alert('This freelancer has not connected a wallet yet. Ask them to add their wallet address first.')
      return
    }

    setActionLoading(`approve-${app.id}`)
    try {
      // 1. Approve in DB
      setTxStatus('Approving application in database...')
      await approveApplication(app.id, userId)

      // 2. Deploy escrow contract on-chain
      setTxStatus('Deploying escrow contract... (confirm in MetaMask)')
      const contractAddr = await deployEscrow(
        userProfile.wallet_address,
        freelancerProfile.wallet_address,
        selectedJob.title,
      )

      // 3. Save contract address to DB
      setTxStatus('Saving contract address...')
      await setJobContractAddress(selectedJob.id, userId, contractAddr)

      // 4. Reload
      const updatedJobs = await reloadJobs()
      const updatedJob = updatedJobs.find(j => j.id === selectedJob.id) || null
      setSelectedJob(updatedJob)
      const apps = await getJobApplications(selectedJob.id)
      setApplications(apps)

      // 5. Prompt to fund
      setPendingContractAddress(contractAddr)
      setShowFundModal(true)
      setTxStatus('')
    } catch (e: any) {
      alert(e.message || 'Transaction failed')
      setTxStatus('')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFundEscrow = async () => {
    const addr = pendingContractAddress || selectedJob?.contract_address
    if (!addr || !fundAmount) return
    setActionLoading('fund')
    try {
      setTxStatus(`Sending ${fundAmount} ETH to escrow... (confirm in MetaMask)`)
      await fundEscrow(addr, fundAmount)
      setShowFundModal(false)
      setPendingContractAddress(null)
      setFundAmount('')
      const info = await getEscrowInfo(addr)
      setEscrowInfo(info)
      setTxStatus('')
    } catch (e: any) {
      alert(e.message || 'Transaction failed')
      setTxStatus('')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveMilestone = async () => {
    if (!selectedJob?.contract_address) return
    setActionLoading('milestone')
    try {
      setTxStatus('Approving milestone and releasing payment... (confirm in MetaMask)')
      await approveEscrowMilestone(selectedJob.contract_address)
      const info = await getEscrowInfo(selectedJob.contract_address)
      setEscrowInfo(info)
      // If all milestones done, mark complete in DB
      if (info.status === EscrowStatus.COMPLETED) {
        await completeJob(selectedJob.id, userId)
        const updatedJobs = await reloadJobs()
        setSelectedJob(updatedJobs.find(j => j.id === selectedJob.id) || null)
      }
      setTxStatus('')
    } catch (e: any) {
      alert(e.message || 'Transaction failed')
      setTxStatus('')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (appId: number) => {
    setActionLoading(`reject-${appId}`)
    try {
      await rejectApplication(appId, userId)
      if (selectedJob) {
        const apps = await getJobApplications(selectedJob.id)
        setApplications(apps)
      }
    } finally {
      setActionLoading(null)
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
      {/* Fund Escrow Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-white font-bold text-xl mb-2">Fund the Escrow</h2>
            <p className="text-slate-400 text-sm mb-6">
              Lock ETH in the smart contract. The freelancer receives it only when you approve their work.
            </p>
            <div className="mb-4">
              <label className="text-white text-sm font-medium block mb-2">Amount (ETH)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={e => setFundAmount(e.target.value)}
                placeholder={`${selectedJob?.budget || '0.0'} (job budget)`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-slate-500 text-xs mt-1">Job budget: {selectedJob?.budget} {selectedJob?.budget_currency}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowFundModal(false); setPendingContractAddress(null) }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleFundEscrow}
                disabled={!fundAmount || actionLoading === 'fund'}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-40"
              >
                {actionLoading === 'fund' ? 'Sending...' : `Send ${fundAmount || '0'} ETH`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400">Manage your jobs and escrow contracts</p>
        </div>
        <Link
          href="/client/post-job"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Post a Job
        </Link>
      </div>

      {/* Wallet banner */}
      {userProfile?.wallet_address ? (
        <div className="glass rounded-2xl p-4 mb-8 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-400 text-sm font-medium">Wallet connected</p>
            <p className="text-slate-500 text-xs font-mono">{userProfile.wallet_address}</p>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-5 mb-8 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm">
            No wallet connected. <Link href="/select-role" className="underline">Go back to connect MetaMask</Link> — required to deploy escrow contracts.
          </p>
        </div>
      )}

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

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Jobs list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-white font-semibold text-lg mb-4">Your Jobs</h2>
          {jobs.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No jobs posted yet</p>
              <Link href="/client/post-job" className="text-indigo-400 text-sm hover:text-indigo-300 inline-flex items-center gap-1">
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
                  <span>{job.application_count} applicants</span>
                  {job.contract_address && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-400">⛓ On-chain</span>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedJob ? (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-xl mb-1">{selectedJob.title}</h2>
                  <p className="text-slate-400 text-sm line-clamp-2">{selectedJob.description}</p>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              {/* Escrow status block */}
              {selectedJob.contract_address && (
                <div className="mb-6 p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-indigo-400 text-sm font-semibold">⛓ Smart Contract Escrow</p>
                    {escrowInfo && <EscrowBadge status={escrowInfo.status} />}
                  </div>
                  <p className="text-slate-500 text-xs font-mono mb-3 break-all">{selectedJob.contract_address}</p>

                  {escrowInfo && (
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">Total Locked</p>
                        <p className="text-white font-semibold">{escrowInfo.totalAmount} ETH</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Current Balance</p>
                        <p className="text-white font-semibold">{escrowInfo.balance} ETH</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Milestones</p>
                        <p className="text-white font-semibold">{escrowInfo.milestonesCompleted}/{escrowInfo.milestoneCount}</p>
                      </div>
                    </div>
                  )}

                  {/* Escrow actions */}
                  {escrowInfo?.status === EscrowStatus.AWAITING_PAYMENT && (
                    <button
                      onClick={() => { setPendingContractAddress(selectedJob.contract_address!); setShowFundModal(true) }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Fund Escrow
                    </button>
                  )}
                  {escrowInfo?.status === EscrowStatus.MILESTONE_REVIEW && (
                    <button
                      onClick={handleApproveMilestone}
                      disabled={actionLoading === 'milestone'}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionLoading === 'milestone' ? 'Processing...' : 'Approve Milestone & Release Payment'}
                    </button>
                  )}
                  {escrowInfo?.status === EscrowStatus.COMPLETED && (
                    <p className="text-emerald-400 text-sm font-medium">✓ Payment released to freelancer</p>
                  )}
                </div>
              )}

              {txStatus && (
                <div className="mb-4 flex items-center gap-2 text-indigo-400 text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  {txStatus}
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
                            {app.bid_amount && <p className="text-emerald-400 text-xs font-semibold">{app.bid_amount} ETH bid</p>}
                            {app.freelancer?.wallet_address ? (
                              <p className="text-slate-600 text-xs font-mono">{app.freelancer.wallet_address.slice(0,8)}...</p>
                            ) : (
                              <p className="text-amber-500 text-xs">⚠ No wallet set</p>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">{app.proposal}</p>
                      {app.status === 'pending' && selectedJob.status === 'open' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                          >
                            {actionLoading?.startsWith('approve') ? 'Deploying...' : 'Approve & Deploy Escrow'}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 bg-red-600/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors disabled:opacity-40"
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
