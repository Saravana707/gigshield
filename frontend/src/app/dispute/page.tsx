"use client";
import { useState } from "react";
import axios from "axios";
import { Shield, Loader2, CheckCircle, XCircle, Scale } from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Verdict = {
  ruling: "FREELANCER" | "CLIENT" | "SPLIT";
  confidence: number;
  reasoning: string;
  recommended_split?: number;
};

export default function DisputePage() {
  const [contractTerms, setContractTerms]     = useState("");
  const [freelancerClaim, setFreelancerClaim] = useState("");
  const [clientClaim, setClientClaim]         = useState("");
  const [evidence, setEvidence]               = useState("");
  const [loading, setLoading]                 = useState(false);
  const [verdict, setVerdict]                 = useState<Verdict | null>(null);
  const [error, setError]                     = useState("");

  async function handleSubmit() {
    if (!contractTerms || !freelancerClaim || !clientClaim) {
      setError("Please fill in the contract terms and both party claims.");
      return;
    }
    setError("");
    setVerdict(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/dispute`, {
        contract_terms: contractTerms,
        freelancer_claim: freelancerClaim,
        client_claim: clientClaim,
        evidence_description: evidence,
      });
      setVerdict(res.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const rulingColor = {
    FREELANCER: "text-teal-400",
    CLIENT: "text-red-400",
    SPLIT: "text-amber-400",
  };

  const rulingBg = {
    FREELANCER: "bg-teal-500/10 border-teal-500/30",
    CLIENT: "bg-red-500/10 border-red-500/30",
    SPLIT: "bg-amber-500/10 border-amber-500/30",
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">AI Dispute Mediator</h1>
        <p className="text-gray-400">
          Submit the contract terms and both parties' claims. Claude will act as a neutral mediator.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Contract Terms / Key Clauses *</label>
          <textarea
            value={contractTerms}
            onChange={(e) => setContractTerms(e.target.value)}
            rows={4}
            placeholder="Paste the relevant contract clauses — payment terms, deliverable definitions, IP ownership, etc."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 resize-none focus:outline-none focus:border-teal-500/50 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Freelancer's Claim *</label>
          <textarea
            value={freelancerClaim}
            onChange={(e) => setFreelancerClaim(e.target.value)}
            rows={3}
            placeholder="Describe what work was completed and why payment should be released..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 resize-none focus:outline-none focus:border-teal-500/50 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Client's Counter-claim *</label>
          <textarea
            value={clientClaim}
            onChange={(e) => setClientClaim(e.target.value)}
            rows={3}
            placeholder="Describe why the client is withholding payment or disputing the milestone..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 resize-none focus:outline-none focus:border-teal-500/50 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Evidence Description <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={2}
            placeholder="Describe any supporting evidence: screenshots, files, messages, deliverables submitted..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 resize-none focus:outline-none focus:border-teal-500/50 placeholder-gray-500"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI Mediator reviewing...
            </>
          ) : (
            <>
              <Scale className="w-4 h-4" />
              Submit for AI Mediation
            </>
          )}
        </button>
      </div>

      {/* Verdict */}
      {verdict && (
        <div className={clsx("mt-8 rounded-xl border p-6", rulingBg[verdict.ruling])}>
          <div className="flex items-center gap-3 mb-4">
            {verdict.ruling === "FREELANCER" ? (
              <CheckCircle className="w-6 h-6 text-teal-400" />
            ) : verdict.ruling === "CLIENT" ? (
              <XCircle className="w-6 h-6 text-red-400" />
            ) : (
              <Scale className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <div className={clsx("text-2xl font-bold", rulingColor[verdict.ruling])}>
                {verdict.ruling === "FREELANCER"
                  ? "Ruled in Favour of Freelancer"
                  : verdict.ruling === "CLIENT"
                  ? "Ruled in Favour of Client"
                  : `Split Decision`}
              </div>
              <div className="text-gray-400 text-sm">
                Mediator confidence: {verdict.confidence}%
              </div>
            </div>
          </div>

          {verdict.ruling === "SPLIT" && verdict.recommended_split !== undefined && (
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-300 mb-2">Recommended Split</div>
              <div className="flex gap-2 items-center">
                <div className="text-teal-400 font-bold">{verdict.recommended_split}% → Freelancer</div>
                <div className="text-gray-500">·</div>
                <div className="text-red-400 font-bold">{100 - verdict.recommended_split}% → Client</div>
              </div>
            </div>
          )}

          <div className="bg-gray-800/40 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Mediator's Reasoning
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{verdict.reasoning}</p>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            In a full deployment, this verdict would trigger automatic fund release via the smart contract.
          </p>
        </div>
      )}
    </div>
  );
}
