'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Briefcase, Code2, ArrowRight, CheckCircle } from 'lucide-react'
import { updateUser } from '@/lib/api'

export default function SelectRole() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selected, setSelected] = useState<'client' | 'freelancer' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected || !session?.user) return
    const userId = (session.user as any).id || session.user.email
    if (!userId) return
    setLoading(true)
    try {
      await updateUser(userId, { role: selected })
      router.push(selected === 'client' ? '/client' : '/freelancer')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">How are you joining?</h1>
          <p className="text-slate-400">
            Welcome, {session?.user?.name?.split(' ')[0]}! Choose your role to continue.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* Client */}
          <button
            onClick={() => setSelected('client')}
            className={`relative text-left p-7 rounded-2xl border-2 transition-all ${
              selected === 'client'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
            }`}
          >
            {selected === 'client' && (
              <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-blue-400" />
            )}
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">I'm a Client</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              I want to post jobs, hire freelancers, and pay securely with crypto escrow.
            </p>
            <ul className="mt-4 space-y-1.5">
              {['Post unlimited jobs', 'Review proposals', 'Crypto escrow payments'].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-400 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {f}
                </li>
              ))}
            </ul>
          </button>

          {/* Freelancer */}
          <button
            onClick={() => setSelected('freelancer')}
            className={`relative text-left p-7 rounded-2xl border-2 transition-all ${
              selected === 'freelancer'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
            }`}
          >
            {selected === 'freelancer' && (
              <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-emerald-400" />
            )}
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Code2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">I'm a Freelancer</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              I want to find jobs, submit proposals, and get paid directly to my crypto wallet.
            </p>
            <ul className="mt-4 space-y-1.5">
              {['Browse open jobs', 'Submit proposals', 'Earn in ETH/crypto'].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-400 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Continue as {selected || '...'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
