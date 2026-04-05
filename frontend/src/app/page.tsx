import Link from "next/link";
import Image from "next/image";
import { Scale, Lock, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">

      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-block bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-medium px-4 py-1 rounded-full mb-6">
          Gig Shield
        </div>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          Work freely. Get paid fairly.
        </p>
        <p className="text-gray-500 max-w-xl mx-auto mb-10">
          A digital lawyer in your pocket and a payment vault you can trust —
          for every freelancer, on every job.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/audit"
            className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Audit a Contract
          </Link>
          <Link
            href="/escrow"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors border border-gray-700"
          >
            Open Escrow Vault
          </Link>
        </div>
      </div>

      {/* Three features */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        <div className="bg-gray-900 border border-teal-500/30 rounded-xl p-6">
          <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
            <Scale className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">AI Legal Auditor</h3>
          <p className="text-gray-400 text-sm">
            Upload your contract. Claude AI reads every clause, flags red flags,
            and gives you a plain-English risk score in seconds.
          </p>
          <Link href="/audit" className="text-teal-400 text-sm mt-3 inline-block hover:underline">
            Audit a contract →
          </Link>
        </div>

        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-6">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Smart Escrow Vault</h3>
          <p className="text-gray-400 text-sm">
            Client locks payment into a blockchain smart contract before work
            starts. Funds release automatically when milestones are approved.
          </p>
          <Link href="/escrow" className="text-amber-400 text-sm mt-3 inline-block hover:underline">
            Open vault →
          </Link>
        </div>

        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Dispute Protocol</h3>
          <p className="text-gray-400 text-sm">
            Disagreement? Evidence locked to IPFS. An AI mediator reads the
            contract and evidence, then enforces a fair ruling automatically.
          </p>
          <Link href="/dispute" className="text-red-400 text-sm mt-3 inline-block hover:underline">
            File a dispute →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 text-center bg-gray-900 rounded-xl p-8 border border-gray-800 mb-20">
        <div>
          <div className="text-4xl font-bold text-teal-400 mb-1">1.57B</div>
          <div className="text-gray-400 text-sm">gig workers worldwide</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-amber-400 mb-1">43%</div>
          <div className="text-gray-400 text-sm">have been unpaid at least once</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-red-400 mb-1">$0</div>
          <div className="text-gray-400 text-sm">legal leverage for most workers</div>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">How It Works</h2>
        <p className="text-gray-400 text-center mb-10">Four steps from signing to getting paid</p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Upload Contract",    desc: "Paste or upload your contract for instant AI analysis.",         color: "text-teal-400"   },
            { step: "02", title: "Get Risk Score",     desc: "See every red flag explained in plain English.",                 color: "text-amber-400"  },
            { step: "03", title: "Lock Escrow",        desc: "Client locks payment on blockchain before work starts.",         color: "text-blue-400"   },
            { step: "04", title: "Get Paid",           desc: "Deliver milestones. Funds release automatically.",              color: "text-green-400"  },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <div className={`text-3xl font-bold mb-3 ${item.color}`}>{item.step}</div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-10 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to protect your work?</h2>
        <p className="text-gray-400 mb-6">Upload your contract and get a free risk analysis in seconds.</p>
        <Link
          href="/audit"
          className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-semibold px-10 py-3 rounded-lg transition-colors inline-block"
        >
          Get Started Free
        </Link>
      </div>

    </div>
  );
}
