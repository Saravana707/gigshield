'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Briefcase, Clock, Users, SlidersHorizontal } from 'lucide-react'
import { getJobs } from '@/lib/api'
import { Job } from '@/types'
import clsx from 'clsx'

export default function BrowseJobs() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filtered, setFiltered] = useState<Job[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobs('open').then(data => {
      setJobs(data)
      setFiltered(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(jobs)
      return
    }
    const q = query.toLowerCase()
    setFiltered(
      jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.skills || '').toLowerCase().includes(q)
      )
    )
  }, [query, jobs])

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/freelancer" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Browse Jobs</h1>
          <p className="text-slate-400">{filtered.length} open positions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title, description, or skills..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No jobs found</p>
          <p className="text-slate-600 text-sm">Try adjusting your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(job => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block glass rounded-2xl p-6 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-white font-semibold text-lg group-hover:text-indigo-400 transition-colors leading-tight">
                  {job.title}
                </h2>
                <span className="text-indigo-400 font-bold text-lg whitespace-nowrap shrink-0">
                  {job.budget} {job.budget_currency}
                </span>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                {job.description}
              </p>

              {job.skills && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {job.client?.name?.[0] || 'C'}
                  </div>
                  {job.client?.name || 'Client'}
                </span>
                {job.deadline && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due {job.deadline}
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {job.application_count} applicants
                </span>
                <span>·</span>
                <span>Posted {formatDate(job.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
