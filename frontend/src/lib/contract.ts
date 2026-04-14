import { ethers } from 'ethers'
import artifact from './GigShieldEscrow.json'

// Platform arbiter — change to your own wallet in production
export const ARBITER_ADDRESS = process.env.NEXT_PUBLIC_ARBITER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const PLATFORM_FEE_BPS = 250 // 2.5%

export enum EscrowStatus {
  AWAITING_PAYMENT  = 0,
  FUNDED            = 1,
  IN_PROGRESS       = 2,
  MILESTONE_REVIEW  = 3,
  DISPUTED          = 4,
  COMPLETED         = 5,
  REFUNDED          = 6,
}

export const STATUS_LABELS: Record<number, string> = {
  0: 'Awaiting Payment',
  1: 'Funded',
  2: 'In Progress',
  3: 'Milestone Review',
  4: 'Disputed',
  5: 'Completed',
  6: 'Refunded',
}

// ─── Wallet ────────────────────────────────────────────────────────────────

export async function connectWallet(): Promise<string> {
  if (!(window as any).ethereum) {
    throw new Error('MetaMask is not installed. Please install it from metamask.io')
  }
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])
  return accounts[0] as string
}

export async function getConnectedWallet(): Promise<string | null> {
  if (!(window as any).ethereum) return null
  const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
  return accounts[0] || null
}

async function getSigner() {
  if (!(window as any).ethereum) throw new Error('MetaMask not found')
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  return provider.getSigner()
}

// ─── Deploy ────────────────────────────────────────────────────────────────

export async function deployEscrow(
  clientAddress: string,
  freelancerAddress: string,
  jobTitle: string,
  milestones = 1,
): Promise<string> {
  const signer = await getSigner()
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer)

  const contract = await factory.deploy(
    clientAddress,
    freelancerAddress,
    ARBITER_ADDRESS,
    jobTitle,
    '',       // ipfsContractCID — empty for now
    milestones,
    PLATFORM_FEE_BPS,
  )

  await contract.waitForDeployment()
  return contract.target as string
}

// ─── Client Actions ────────────────────────────────────────────────────────

export async function fundEscrow(contractAddress: string, amountEth: string) {
  const signer = await getSigner()
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer)
  const tx = await contract.deposit({ value: ethers.parseEther(amountEth) })
  await tx.wait()
}

export async function approveMilestone(contractAddress: string) {
  const signer = await getSigner()
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer)
  const tx = await contract.approveMilestone()
  await tx.wait()
}

export async function requestRefund(contractAddress: string) {
  const signer = await getSigner()
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer)
  const tx = await contract.requestRefund()
  await tx.wait()
}

// ─── Freelancer Actions ────────────────────────────────────────────────────

export async function startWork(contractAddress: string) {
  const signer = await getSigner()
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer)
  const tx = await contract.startWork()
  await tx.wait()
}

export async function submitMilestone(contractAddress: string) {
  const signer = await getSigner()
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer)
  const tx = await contract.submitMilestone()
  await tx.wait()
}

// ─── Read ──────────────────────────────────────────────────────────────────

export interface EscrowInfo {
  status: number
  statusLabel: string
  totalAmount: string
  balance: string
  milestonesCompleted: number
  milestoneCount: number
}

export async function getEscrowInfo(contractAddress: string): Promise<EscrowInfo> {
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider)

  const [statusRaw, totalAmount, balance, milestonesCompleted, milestoneCount] = await Promise.all([
    contract.status(),
    contract.totalAmount(),
    contract.getBalance(),
    contract.milestonesCompleted(),
    contract.milestoneCount(),
  ])

  const status = Number(statusRaw)

  return {
    status,
    statusLabel: STATUS_LABELS[status] || 'Unknown',
    totalAmount: ethers.formatEther(totalAmount),
    balance: ethers.formatEther(balance),
    milestonesCompleted: Number(milestonesCompleted),
    milestoneCount: Number(milestoneCount),
  }
}
