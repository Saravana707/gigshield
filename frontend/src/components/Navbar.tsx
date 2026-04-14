'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Shield, LogOut, ChevronDown, Briefcase, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUser } from '@/lib/api'
import { User } from '@/types'
import clsx from 'clsx'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      const userId = (session.user as any).id || session.user.email
      if (userId) {
        getUser(userId).then(setProfile).catch(() => {})
      }
    }
  }, [session])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const dashboardHref = profile?.role === 'client' ? '/client' : profile?.role === 'freelancer' ? '/freelancer' : '/select-role'

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          Gig<span className="gradient-text">Shield</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {profile?.role && (
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href={dashboardHref}
                    className={clsx(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      pathname.startsWith('/client') || pathname.startsWith('/freelancer')
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {profile.role === 'client' ? (
                      <Briefcase className="w-4 h-4" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Dashboard
                  </Link>
                </div>
              )}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm text-white font-medium max-w-[120px] truncate">
                    {session.user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl p-2 shadow-xl border border-white/10">
                    <div className="px-3 py-2 border-b border-white/10 mb-2">
                      <p className="text-white text-sm font-medium truncate">{session.user?.name}</p>
                      <p className="text-slate-500 text-xs truncate">{session.user?.email}</p>
                      {profile?.role && (
                        <span className={clsx(
                          'inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          profile.role === 'client' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {profile.role === 'client' ? 'Client' : 'Freelancer'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/"
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}
