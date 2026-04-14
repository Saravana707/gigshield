'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Briefcase, DollarSign, Calendar, Tag } from 'lucide-react'
import { createJob } from '@/lib/api'

const CURRENCY_OPTIONS = ['ETH', 'MATIC', 'USDC', 'BNB']

export default function PostJob() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    budget_currency: 'ETH',
    skills: '',
    deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const userId = (session?.user as any)?.id || session?.user?.email || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.budget) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createJob(userId, {
        title: form.title,
        description: form.description,
        budget: parseFloat(form.budget),
        budget_currency: form.budget_currency,
        skills: form.skills || undefined,
        deadline: form.deadline || undefined,
      })
      router.push('/client')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to post job. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/client" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Post a New Job</h1>
        <p className="text-slate-400">Describe your project clearly to attract the best freelancers.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Job Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Build a React dashboard for crypto analytics"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the project scope, deliverables, and any specific requirements..."
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Budget <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.001"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <select
              value={form.budget_currency}
              onChange={e => setForm({ ...form, budget_currency: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {CURRENCY_OPTIONS.map(c => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Required Skills
          </label>
          <input
            type="text"
            value={form.skills}
            onChange={e => setForm({ ...form, skills: e.target.value })}
            placeholder="e.g. React, TypeScript, Solidity (comma-separated)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Deadline
          </label>
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Briefcase className="w-5 h-5" />
              Post Job
            </>
          )}
        </button>
      </form>
    </div>
  )
}
