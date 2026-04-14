'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Shield, Zap, Lock, ArrowRight, Github } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/select-role')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Crypto-powered freelance marketplace
          </span>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
            Hire & get hired.
            <br />
            <span className="gradient-text">Get paid trustlessly.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            GigShield connects clients and freelancers with AI contract review,
            crypto escrow payments, and on-chain dispute resolution.
          </p>

          {/* Auth buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => signIn('github')}
              className="flex items-center gap-3 px-8 py-4 bg-slate-800 border border-slate-700 text-white font-semibold rounded-2xl hover:bg-slate-700 transition-all w-full sm:w-auto justify-center"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <p className="text-slate-600 text-sm mt-6">
            No wallet required to sign up. Connect later when you're ready.
          </p>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Client flow */}
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-blue-400 text-lg font-bold">C</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">For Clients</h3>
                <p className="text-slate-500 text-sm">Post jobs & hire talent</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { n: '01', t: 'Post a job', d: 'Describe your project, set budget in ETH' },
                { n: '02', t: 'Review applications', d: 'Browse proposals from verified freelancers' },
                { n: '03', t: 'Hire & fund escrow', d: 'Approve your pick, funds locked in smart contract' },
                { n: '04', t: 'Release payment', d: 'Approve work → funds auto-sent to their wallet' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <span className="text-indigo-400 font-mono text-sm font-bold w-8 shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{s.t}</p>
                    <p className="text-slate-500 text-xs">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Freelancer flow */}
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <span className="text-emerald-400 text-lg font-bold">F</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">For Freelancers</h3>
                <p className="text-slate-500 text-sm">Find gigs & get paid in crypto</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { n: '01', t: 'Browse open jobs', d: 'Filter by skills, budget, and deadline' },
                { n: '02', t: 'Submit proposal', d: 'Pitch your bid and estimated timeline' },
                { n: '03', t: 'Get approved', d: 'Client accepts your proposal, work begins' },
                { n: '04', t: 'Deliver & earn', d: 'Funds released to your crypto wallet on completion' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <span className="text-emerald-400 font-mono text-sm font-bold w-8 shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{s.t}</p>
                    <p className="text-slate-500 text-xs">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="w-5 h-5 text-indigo-400" />,
              bg: 'bg-indigo-500/10',
              title: 'AI Contract Auditor',
              desc: 'Every job contract is analyzed by Claude AI. Red flags flagged, risks explained in plain English.',
            },
            {
              icon: <Lock className="w-5 h-5 text-purple-400" />,
              bg: 'bg-purple-500/10',
              title: 'Crypto Escrow',
              desc: 'Payment locked in a smart contract before work starts. Auto-released on job approval.',
            },
            {
              icon: <Zap className="w-5 h-5 text-cyan-400" />,
              bg: 'bg-cyan-500/10',
              title: 'AI Dispute Resolution',
              desc: 'Disagreements resolved by AI mediator using contract terms and evidence submitted on-chain.',
            },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 hover:border-indigo-500/25 transition-colors">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
