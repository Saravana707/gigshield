"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Lock, Unlock, CheckCircle, AlertTriangle, Loader2, Wallet } from "lucide-react";
import clsx from "clsx";

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

// Hardhat test private keys (safe for local dev only — never use on mainnet)
const HARDHAT_KEYS = {
  client:     "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1
  freelancer: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account #2
};

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

type EthWindow = Window & { ethereum?: ethers.Eip1193Provider };

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

  // Keep account in sync when user switches in MetaMask
  useEffect(() => {
    const eth = (window as EthWindow).ethereum;
    if (!eth) return;
    const handler = (accounts: string[]) => {
      setAccount(accounts[0] || null);
      setSuccess(accounts[0] ? `Switched to: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}` : "");
    };
    eth.on?.("accountsChanged", handler);
    return () => eth.removeListener?.("accountsChanged", handler);
  }, []);

  async function connectWallet() {
    const eth = (window as EthWindow).ethereum;
    if (!eth) {
      setError("MetaMask not detected. Install MetaMask to continue.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const accounts: string[] = await provider.send("eth_accounts", []);
      const selected = accounts[0];
      setAccount(selected);
      setError("");
      setSuccess(`Connected: ${selected.slice(0,6)}...${selected.slice(-4)}`);
    } catch {
      setError("Wallet connection rejected.");
    }
  }

  // READ-only — no wallet needed
  async function getReadContract() {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    return new ethers.Contract(contractAddress, ESCROW_ABI, provider);
  }

  // WRITE — uses hardcoded Hardhat key for the correct role
  async function getContract(role: "client" | "freelancer" = "client") {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(HARDHAT_KEYS[role], provider);
    return new ethers.Contract(contractAddress, ESCROW_ABI, signer);
  }

  async function loadInfo() {
    setLoading("info");
    setError("");
    try {
      const contract = await getReadContract();
      if (!contract) { setError("Enter a contract address."); setLoading(null); return; }
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
    } catch (err: unknown) {
      console.error("loadInfo error:", err);
      setError("Could not load contract. Make sure Hardhat node is running and the address is correct.");
    } finally {
      setLoading(null);
    }
  }

  async function doDeposit() {
    setLoading("deposit"); setError(""); setSuccess("");
    try {
      const contract = await getContract("client");
      if (!contract) { setError("Contract not available."); return; }
      const tx = await contract.deposit({ value: ethers.parseEther(depositAmount) });
      setSuccess("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setSuccess(`Deposited ${depositAmount} ETH — funds locked in escrow!`);
      loadInfo();
    } catch (err: unknown) {
      console.error("deposit error:", err);
      setError((err as Error)?.message?.split("(")[0] || "Transaction failed.");
    } finally {
      setLoading(null);
    }
  }

  async function doAction(action: string) {
    setLoading(action); setError(""); setSuccess("");
    try {
      // Client actions: approveMilestone
      // Freelancer actions: startWork, submitMilestone
      const role = action === "approveMilestone" ? "client" : "freelancer";
      const contract = await getContract(role);
      if (!contract) { setError("Contract not available."); return; }

      let tx;
      if (action === "startWork")             tx = await contract.startWork();
      else if (action === "submitMilestone")  tx = await contract.submitMilestone();
      else if (action === "approveMilestone") tx = await contract.approveMilestone();
      else return;

      setSuccess("Transaction submitted...");
      await tx.wait();

      const labels: Record<string, string> = {
        startWork: "Work started — freelancer is on it!",
        submitMilestone: "Milestone submitted for client review.",
        approveMilestone: "Milestone approved — funds released to freelancer!",
      };
      setSuccess(labels[action] || "Done.");
      loadInfo();
    } catch (err: unknown) {
      console.error("action error:", err);
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

      {/* Wallet */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium font-mono text-sm">
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Wallet not connected"}
            </span>
          </div>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Connect MetaMask
            </button>
          ) : (
            <span className="text-teal-400 text-sm font-medium">Connected</span>
          )}
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
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
                {STATUS_LABELS[status] ?? "Unknown"}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Vault Balance</div>
              <div className="text-amber-400 font-semibold text-sm">{String(info.balance)} ETH</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Milestones</div>
              <div className="text-white font-semibold text-sm">
                {String(info.milestonesCompleted)} / {String(info.milestoneCount)} complete
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Total Locked</div>
              <div className="text-amber-400 font-semibold text-sm">{String(info.totalAmount)} ETH</div>
            </div>
          </div>

          {/* Role hint */}
          <div className="text-xs text-gray-500 mb-4 flex gap-4">
            <span>🟡 Client: Account #1</span>
            <span>🟢 Freelancer: Account #2</span>
          </div>

          <div className="space-y-2">
            {status === 0 && (
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <button
                  onClick={doDeposit}
                  disabled={!!loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading === "deposit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Lock Payment in Escrow (Client)
                </button>
              </div>
            )}

            {status === 1 && (
              <button onClick={() => doAction("startWork")} disabled={!!loading}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading === "startWork" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Work Started (Freelancer)
              </button>
            )}

            {status === 2 && (
              <button onClick={() => doAction("submitMilestone")} disabled={!!loading}
                className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading === "submitMilestone" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Submit Milestone for Review (Freelancer)
              </button>
            )}

            {status === 3 && (
              <button onClick={() => doAction("approveMilestone")} disabled={!!loading}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading === "approveMilestone" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                Approve Milestone — Release Funds (Client)
              </button>
            )}

            {status === 5 && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-4 rounded-xl text-center font-semibold">
                🎉 Contract Complete — All funds released!
              </div>
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
