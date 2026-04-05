"use client";
import { Scale, Lock, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const team = [
  { name: "Srimathi",  role: "Team Leader" },
  { name: "Pavitra",   role: "Team Member" },
  { name: "Dhiya",     role: "Team Member" },
  { name: "Saravanan", role: "Team Member" },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">

      <div className="text-center mb-16">
        <div className="inline-block bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-medium px-4 py-1 rounded-full mb-6">
          HACKRAX 26 — Team GigShield
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">About Us</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          We built GigShield because gig workers deserve the same protection as everyone else.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">The Problem</h2>
        <p className="text-gray-400 leading-relaxed mb-4">
          Freelancers sign contracts full of legal jargon they cannot understand.
          They do the work. Then the client disappears without paying.
        </p>
        <p className="text-gray-400 leading-relaxed">
          <span className="text-red-400 font-semibold">43% of freelancers</span> have
          been unpaid for completed work. There are 1.57 billion gig workers
          worldwide with almost no legal protection.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Scale className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">1. Upload Your Contract</h3>
            <p className="text-gray-400 text-sm">AI reads every clause and gives you a risk score instantly.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">2. Get Your Risk Score</h3>
            <p className="text-gray-400 text-sm">Red flags highlighted in plain English before you sign.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">3. Lock Payment in Escrow</h3>
            <p className="text-gray-400 text-sm">Client locks full payment in blockchain before work starts.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">4. Deliver and Get Paid</h3>
            <p className="text-gray-400 text-sm">Milestone approved. Funds released automatically. No chasing.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Built With</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4"> 
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-blue-400 font-semibold text-sm mb-1">Next.js</div>
            <div className="text-gray-500 text-xs">Frontend website</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-green-400 font-semibold text-sm mb-1">FastAPI</div>
            <div className="text-gray-500 text-xs">Python backend server</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-amber-400 font-semibold text-sm mb-1">Solidity</div>
            <div className="text-gray-500 text-xs">Smart contract code</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-purple-400 font-semibold text-sm mb-1">Polygon</div>
            <div className="text-gray-500 text-xs">Blockchain network</div>
          </div>
	  <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-teal-400 font-semibold text-sm mb-1">Claude AI</div>
            <div className="text-gray-500 text-xs">Contract analysis and dispute mediation</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-red-400 font-semibold text-sm mb-1">IPFS</div>
            <div className="text-gray-500 text-xs">Tamper-proof evidence storage</div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Meet the Team</h2>
        <p className="text-gray-400 text-center mb-8">Thiagarajar College of Engineering, Madurai</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {team.map((member, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-teal-400 font-bold text-lg">
                  {member.name.charAt(0)}
                </span>
              </div>
              <div className="text-white font-semibold">{member.name}</div>
              <div className="text-gray-500 text-xs mt-1">{member.role}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-10 text-center">
        <p className="text-gray-400 text-sm mb-6">
          Built for HACKRAX 26 — Department of Computer Science Engineering, TCE
        </p>
        <Link
          href="https://www.instagram.com/sar_luci4/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400/60 text-purple-300 hover:text-purple-200 px-6 py-3 rounded-xl transition-all"
        >
          <Instagram className="w-4 h-4" />
          @sar_luci4
        </Link>
        <p className="text-gray-600 text-xs mt-8">
          2025 GigShield — Team GigShield, TCE Madurai
        </p>
      </div>

    </div>
  );
}
