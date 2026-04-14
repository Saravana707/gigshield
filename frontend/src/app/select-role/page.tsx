'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Briefcase, Code2, ArrowRight, CheckCircle, Wallet, AlertTriangle } from 'lucide-react'
import { updateUser } from '@/lib/api'
import { connectWallet } from '@/lib/contract'

export default function SelectRole() {
  const { data: session } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<'wallet' | 'role'>('wallet')
  const [wallet, setWallet] = useState<string | null>(null)
  const [selected, setSelected] = useState<'client' | 'freelancer' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnectWallet = async () => {
    setError('')
    setLoading(true)
    try {
      const address = await connectWallet()
      setWallet(address)
      setStep('role')
    } catch (e: any) {
      setError(e.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!selected || !session?.user || !wallet) return
    const userId = (session.user as any).id || session.user.email
    if (!userId) return
    setLoading(true)
    try {
      await updateUser(userId, { role: selected, wallet_address: wallet })
      router.push(selected === 'client' ? '/client' : '/freelancer')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">

        {/* Step indicator */}
        <div className="flex items-center gap-3 justify-center mb-10">
          {['Connect Wallet', 'Choose Role'].map((label, i) => {
            const done = (i === 0 && step === 'role') || false
            const active = (i === 0 && step === 'wallet') || (i === 1 && step === 'role')
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-500'
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                </div>
                {i === 0 && <div className="w-10 h-px bg-white/10" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Connect Wallet */}
        {step === 'wallet' && (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3">Connect your wallet</h1>
            <p className="text-slate-400 mb-10 max-w-md mx-auto">
              Welcome, {session?.user?.name?.split(' ')[0]}! Your wallet is needed to send and receive crypto payments on GigShield.
            </p>

            <div className="glass rounded-2xl p-8 mb-6">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Wallet className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">MetaMask</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                GigShield uses MetaMask to sign blockchain transactions. Your funds are always in your control.
              </p>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-all disabled:opacity-40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
                      <path d="M36.5 3.5L22.5 13.5L25 7L36.5 3.5Z" fill="#E17726" stroke="#E17726" strokeWidth="0.5"/>
                      <path d="M3.5 3.5L17.4 13.6L15 7L3.5 3.5Z" fill="#E27625" stroke="#E27625" strokeWidth="0.5"/>
                      <path d="M31.5 28L27.5 34L35.5 36.5L38 28H31.5Z" fill="#E27625" stroke="#E27625" strokeWidth="0.5"/>
                      <path d="M2 28L4.5 36.5L12.5 34L8.5 28H2Z" fill="#E27625" stroke="#E27625" strokeWidth="0.5"/>
                    </svg>
                    Connect MetaMask
                  </>
                )}
              </button>

              {!(window as any)?.ethereum && (
                <p className="text-slate-500 text-xs mt-3">
                  Don't have MetaMask?{' '}
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                    Install it here
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Choose Role */}
        {step === 'role' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-2 rounded-full mb-4">
                <CheckCircle className="w-4 h-4" />
                Wallet connected: {wallet?.slice(0, 6)}...{wallet?.slice(-4)}
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">How are you joining?</h1>
              <p className="text-slate-400">Choose your role — you can change this later.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              <button
                onClick={() => setSelected('client')}
                className={`relative text-left p-7 rounded-2xl border-2 transition-all ${
                  selected === 'client'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {selected === 'client' && <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-blue-400" />}
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5">
                  <Briefcase className="w-7 h-7 text-blue-400" />
                </div>
                <h2 className="text-white font-bold text-xl mb-2">I'm a Client</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Post jobs, hire freelancers, and pay with crypto escrow.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {['Post unlimited jobs', 'Review proposals', 'Secure ETH escrow'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-slate-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />{f}
                    </li>
                  ))}
                </ul>
              </button>

              <button
                onClick={() => setSelected('freelancer')}
                className={`relative text-left p-7 rounded-2xl border-2 transition-all ${
                  selected === 'freelancer'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {selected === 'freelancer' && <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-emerald-400" />}
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
                  <Code2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-white font-bold text-xl mb-2">I'm a Freelancer</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Find jobs, submit proposals, and get paid in crypto.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {['Browse open jobs', 'Submit proposals', 'Earn in ETH directly'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-slate-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{f}
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
                <>Continue as {selected || '...'} <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
