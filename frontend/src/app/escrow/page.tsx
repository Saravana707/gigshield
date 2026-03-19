"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { Lock, Unlock, CheckCircle, AlertTriangle, Loader2, Wallet } from "lucide-react";
import clsx from "clsx";

// Minimal ABI — only the functions we call in the UI
const ESCROW_ABI = [
  "function deposit() external payable",
  "function startWork() external",
  "function submitMilestone() external",
  "function approveMilestone() external",
  "function raiseDispute(string calldata _evidenceCID) external",
  "function getBalance() external view returns (uint256)",
  "function getContractInfo() external view returns (address, address, uint256, uint256, uint8, uint256, uint256, string, string, string)",
  "event Funded(address indexed client, uint256 amount, uint256 timestamp)",
  "event MilestoneApproved(uint256 milestoneIndex, uint256 amountReleased, uint256 timestamp)",
];

const STATUS_LABELS = [
  "Awaiting Payment",
  "Funded — Work Can Begin",
  "In Progress",
  "Milestone Under Review",
  "Disputed",
  "Completed",
  "Refunded",
];

const STATUS_COLORS = [
  "text-gray-400",
  "text-amber-400",
  "text-teal-400",
  "text-blue-400",
  "text-red-400",
  "text-green-400",
  "text-gray-400",
];

export default function EscrowPage() {
  const [contractAddress, setContractAddress] = useState(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""
  );
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  async function connectWallet() {
    if (!(window as unknown as { ethereum?: unknown }).ethereum) {
      setError("MetaMask not detected. Install MetaMask to use the escrow vault.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setSuccess(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch {
      setError("Wallet connection rejected.");
    }
  }

  async function getContract() {
    if (!(window as unknown as { ethereum?: unknown }).ethereum || !contractAddress) return null;
    const provider = new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, ESCROW_ABI, signer);
  }

  async function loadInfo() {
    setLoading("info");
    setError("");
    try {
      const contract = await getContract();
      if (!contract) { setError("Connect wallet first."); setLoading(null); return; }
      const raw = await contract.getContractInfo();
      setInfo({
        client: raw[0],
        freelancer: raw[1],
        totalAmount: ethers.formatEther(raw[2]),
        balance: ethers.formatEther(raw[3]),
        status: Number(raw[4]),
        milestonesCompleted: Number(raw[5]),
        milestoneCount: Number(raw[6]),
        jobTitle: raw[7],
      });
    } catch {
      setError("Could not load contract. Check the address.");
    } finally {
      setLoading(null);
    }
  }

  async function doDeposit() {
    setLoading("deposit"); setError(""); setSuccess("");
    try {
      const contract = await getContract();
      if (!contract) { setError("Connect wallet first."); return; }
      const tx = await contract.deposit({ value: ethers.parseEther(depositAmount) });
      setSuccess("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setSuccess(`Deposited ${depositAmount} MATIC — funds locked in escrow!`);
      loadInfo();
    } catch (err: unknown) {
      setError((err as Error)?.message?.split("(")[0] || "Transaction failed.");
    } finally {
      setLoading(null);
    }
  }

  async function doAction(action: string) {
    setLoading(action); setError(""); setSuccess("");
    try {
      const contract = await getContract();
      if (!contract) { setError("Connect wallet first."); return; }
      let tx;
      if (action === "startWork")       tx = await contract.startWork();
      else if (action === "submitMilestone") tx = await contract.submitMilestone();
      else if (action === "approveMilestone") tx = await contract.approveMilestone();
      else return;
      setSuccess("Transaction submitted...");
      await tx.wait();
      const labels: Record<string, string> = {
        startWork: "Work started — client notified.",
        submitMilestone: "Milestone submitted for client review.",
        approveMilestone: "Milestone approved — funds released to freelancer!",
      };
      setSuccess(labels[action] || "Done.");
      loadInfo();
    } catch (err: unknown) {
      setError((err as Error)?.message?.split("(")[0] || "Transaction failed.");
    } finally {
      setLoading(null);
    }
  }

  const status = info ? Number(info.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Smart Escrow Vault</h1>
        <p className="text-gray-400">
          Payment locked by code — not promises. Released only when milestones are approved.
        </p>
      </div>

      {/* Wallet connect */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium">
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Wallet not connected"}
            </span>
          </div>
          {!account && (
            <button
              onClick={connectWallet}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Connect MetaMask
            </button>
          )}
          {account && <span className="text-teal-400 text-sm">Connected</span>}
        </div>
      </div>

      {/* Contract address */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <label className="text-sm text-gray-400 mb-2 block">Contract Address</label>
        <div className="flex gap-2">
          <input
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50 font-mono"
          />
          <button
            onClick={loadInfo}
            disabled={loading === "info"}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {loading === "info" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
          </button>
        </div>
      </div>

      {/* Status + Actions */}
      {info && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">{String(info.jobTitle)}</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Status</div>
              <div className={clsx("font-semibold text-sm", STATUS_COLORS[status])}>
                {STATUS_LABELS[status]}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Vault Balance</div>
              <div className="text-amber-400 font-semibold text-sm">{String(info.balance)} MATIC</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Milestones</div>
              <div className="text-white font-semibold text-sm">
                {String(info.milestonesCompleted)} / {String(info.milestoneCount)} complete
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Total Locked</div>
              <div className="text-amber-400 font-semibold text-sm">{String(info.totalAmount)} MATIC</div>
            </div>
          </div>

          {/* Action buttons based on status */}
          <div className="space-y-2">
            {status === 0 && (
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount in MATIC"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <button
                  onClick={doDeposit}
                  disabled={!!loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading === "deposit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Lock Payment in Escrow
                </button>
              </div>
            )}

            {status === 1 && (
              <button onClick={() => doAction("startWork")} disabled={!!loading}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading === "startWork" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Work Started
              </button>
            )}

            {status === 2 && (
              <button onClick={() => doAction("submitMilestone")} disabled={!!loading}
                className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading === "submitMilestone" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Submit Milestone for Review
              </button>
            )}

            {status === 3 && (
              <button onClick={() => doAction("approveMilestone")} disabled={!!loading}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading === "approveMilestone" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                Approve Milestone — Release Funds
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm p-4 rounded-xl flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}
    </div>
  );
}
