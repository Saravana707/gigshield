"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RiskFlag = {
  clause: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  explanation: string;
  recommendation: string;
};

type Analysis = {
  overall_risk_score: number;
  summary: string;
  worker_friendly: boolean;
  payment_risk: number;
  ip_risk: number;
  liability_risk: number;
  termination_risk: number;
  flags: RiskFlag[];
};

function RiskBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? "bg-red-500" : value >= 40 ? "bg-amber-500" : "bg-teal-500";
  const textColor =
    value >= 70 ? "text-red-400" : value >= 40 ? "text-amber-400" : "text-teal-400";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className={clsx("font-bold", textColor)}>{value}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx("h-2 rounded-full risk-bar", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FlagCard({ flag }: { flag: RiskFlag }) {
  const colors = {
    HIGH:   { bg: "bg-red-500/10",   border: "border-red-500/30",   badge: "bg-red-500/20 text-red-400",   icon: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> },
    MEDIUM: { bg: "bg-amber-500/10", border: "border-amber-500/30", badge: "bg-amber-500/20 text-amber-400", icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> },
    LOW:    { bg: "bg-teal-500/10",  border: "border-teal-500/30",  badge: "bg-teal-500/20 text-teal-400",  icon: <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" /> },
  };
  const c = colors[flag.risk_level];
  return (
    <div className={clsx("rounded-xl p-4 border", c.bg, c.border)}>
      <div className="flex items-start gap-3 mb-3">
        {c.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", c.badge)}>
              {flag.risk_level}
            </span>
          </div>
          <p className="text-gray-300 text-sm italic mb-2">"{flag.clause}"</p>
          <p className="text-gray-400 text-sm mb-2">{flag.explanation}</p>
          <div className="bg-gray-800/60 rounded-lg p-2">
            <p className="text-xs text-gray-300">
              <span className="font-semibold text-white">Recommendation: </span>
              {flag.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"file" | "text">("file");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAnalyze() {
    setError("");
    setAnalysis(null);
    setLoading(true);

    try {
      let data: Analysis;
      if (mode === "file" && file) {
        const form = new FormData();
        form.append("file", file);
        const res = await axios.post(`${API}/analyze`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        data = res.data;
      } else if (mode === "text" && text.trim()) {
        const res = await axios.post(`${API}/analyze-text`, { text });
        data = res.data;
      } else {
        setError("Please upload a file or paste contract text.");
        setLoading(false);
        return;
      }
      setAnalysis(data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || "Something went wrong. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    analysis && analysis.overall_risk_score >= 70
      ? "text-red-400"
      : analysis && analysis.overall_risk_score >= 40
      ? "text-amber-400"
      : "text-teal-400";

  const highFlags = analysis?.flags.filter((f) => f.risk_level === "HIGH") ?? [];
  const otherFlags = analysis?.flags.filter((f) => f.risk_level !== "HIGH") ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">AI Legal Auditor</h1>
        <p className="text-gray-400">
          Upload your contract and get an instant risk analysis powered by Claude AI.
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("file")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              mode === "file"
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-gray-400 hover:text-white bg-gray-800"
            )}
          >
            Upload PDF / TXT
          </button>
          <button
            onClick={() => setMode("text")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              mode === "text"
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-gray-400 hover:text-white bg-gray-800"
            )}
          >
            Paste Text
          </button>
        </div>

        {mode === "file" ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-teal-500/50 rounded-xl p-10 text-center cursor-pointer transition-colors group"
          >
            <Upload className="w-8 h-8 text-gray-500 group-hover:text-teal-400 mx-auto mb-3 transition-colors" />
            {file ? (
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 font-medium">Drop your contract here</p>
                <p className="text-gray-500 text-sm mt-1">PDF or TXT, up to 10MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your contract text here..."
            className="w-full h-48 bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 resize-none focus:outline-none focus:border-teal-500/50 placeholder-gray-500"
          />
        )}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing with Claude AI...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Analyze Contract
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Score overview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Risk Assessment</h2>
                <p className="text-gray-400 text-sm mt-1">{analysis.summary}</p>
              </div>
              <div className="text-right">
                <div className={clsx("text-5xl font-bold", scoreColor)}>
                  {analysis.overall_risk_score}
                </div>
                <div className="text-gray-500 text-xs">/ 100 risk</div>
              </div>
            </div>

            <div className={clsx(
              "flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-5",
              analysis.worker_friendly
                ? "bg-teal-500/10 border border-teal-500/30 text-teal-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            )}>
              {analysis.worker_friendly
                ? <CheckCircle className="w-4 h-4" />
                : <XCircle className="w-4 h-4" />}
              {analysis.worker_friendly
                ? "This contract is reasonably fair for the worker"
                : "This contract has significant risks for the worker — review carefully"}
            </div>

            <div className="space-y-3">
              <RiskBar label="Payment Terms"       value={analysis.payment_risk} />
              <RiskBar label="IP Ownership"        value={analysis.ip_risk} />
              <RiskBar label="Liability Clauses"   value={analysis.liability_risk} />
              <RiskBar label="Termination Rights"  value={analysis.termination_risk} />
            </div>
          </div>

          {/* Flags */}
          {highFlags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                High Risk Clauses ({highFlags.length})
              </h3>
              <div className="space-y-3">
                {highFlags.map((f, i) => <FlagCard key={i} flag={f} />)}
              </div>
            </div>
          )}

          {otherFlags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Other Findings ({otherFlags.length})
              </h3>
              <div className="space-y-3">
                {otherFlags.map((f, i) => <FlagCard key={i} flag={f} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
