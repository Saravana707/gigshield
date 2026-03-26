# GigShield — The Gig-Worker Advocate Portal

> AI + Blockchain giving every freelancer a digital lawyer and a payment vault.

[![GitHub](https://img.shields.io/badge/GitHub-Saravana707%2Fgigshield-blue)](https://github.com/Saravana707/gigshield)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## The Problem

Millions of gig workers sign contracts they cannot fully understand, deliver their work, and then get ghosted by clients who simply refuse to pay. There is no neutral enforcer, no safety net, and no affordable way to fight back.

- **1.57 billion** gig workers worldwide
- **43%** of freelancers have been unpaid for completed work
- **87M+** gig workers in India alone with zero legal protection
- **$0** legal leverage for most workers against non-paying clients

---

## The Solution

GigShield is a unified web platform that combines AI and blockchain to give every freelancer three powerful shields on every job.

### Shield 1 — AI Legal Auditor
Upload any contract. Claude AI reads every clause against a knowledge base of labor laws, outputs a 0–100 risk score, and flags predatory clauses in plain English — before you sign.

### Shield 2 — Smart Escrow Vault
Client locks the full payment into a Solidity smart contract on the Polygon blockchain before work starts. Neither party can touch the funds. Money releases automatically when milestones are approved.

### Shield 3 — Dispute Protocol
If a dispute arises, both parties submit evidence which gets pinned permanently to IPFS. An AI mediator reads the contract and all evidence, then issues a structured ruling. The smart contract executes it automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TailwindCSS, ethers.js, MetaMask |
| AI Backend | FastAPI (Python), Claude API (claude-sonnet-4-5) |
| Blockchain | Solidity 0.8+, Hardhat, Polygon Mumbai Testnet |
| Storage | IPFS via web3.storage, Supabase |

---

## Project Structure

```
gigshield/
├── backend/          ← FastAPI + Claude AI (Python)
├── contracts/        ← Solidity + Hardhat (Blockchain)
└── frontend/         ← Next.js 14 + Tailwind (UI)
```

---

## Quick Start

### Requirements

- Python 3.12+
- Node.js 18+
- MetaMask browser extension
- Anthropic API key (console.anthropic.com)

---

### Step 1 — Backend (AI Contract Analyzer)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # bash/zsh
source venv/bin/activate.fish   # fish shell

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Start the server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

### Step 2 — Smart Contract (Blockchain Escrow)

```bash
cd contracts

# Install dependencies
npm install

# Terminal 1 — Start local blockchain
npx hardhat compile
npx hardhat node

# Terminal 2 — Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address printed in the terminal.

---

### Step 3 — Frontend (Next.js UI)

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
nano .env.local
```

Add these two lines:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_deployed_address
```

```bash
# Start the frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Running Everything Together

Open four terminals simultaneously in this order:

```bash
# Terminal 1 — Local blockchain
cd contracts && npx hardhat node

# Terminal 2 — Deploy contract (run once)
cd contracts && npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 — AI backend
cd backend && source venv/bin/activate.fish && uvicorn main:app --reload

# Terminal 4 — Frontend
cd frontend && npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage with project overview and stats |
| `/audit` | Upload or paste a contract for AI risk analysis |
| `/escrow` | Connect MetaMask and manage the escrow vault |
| `/dispute` | Submit a dispute for AI mediation |
| `/about` | About the team and how GigShield works |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/analyze` | Upload PDF/TXT contract for analysis |
| POST | `/analyze-text` | Analyze pasted contract text |
| POST | `/dispute` | Submit dispute for AI mediation |

### Example — Analyze a contract

```bash
curl -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Payment will be made within 90 days. The freelancer assigns all IP to the client forever."}'
```

---

## Smart Contract Flow

```
AWAITING_PAYMENT
      ↓  client deposits funds
   FUNDED
      ↓  freelancer starts work
  IN_PROGRESS
      ↓  freelancer submits milestone
MILESTONE_REVIEW
      ↓  client approves
  IN_PROGRESS  (repeat per milestone)
      ↓  all milestones done
  COMPLETED

  At any stage either party can raise a dispute:
      ↓  raiseDispute(evidenceCID)
  DISPUTED
      ↓  AI mediator resolves
  COMPLETED
```

---

## Environment Variables

### backend/.env
```
ANTHROPIC_API_KEY=your_claude_api_key
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_contract_address
```

### contracts/.env (for Polygon Mumbai deployment)
```
PRIVATE_KEY=your_wallet_private_key
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
```

---

## Important Security Notes

- Never commit `.env` files to GitHub — they are listed in `.gitignore`
- Never put API keys directly in code — always use `.env` files
- The Hardhat test accounts and private keys shown during `npx hardhat node` are public — never use them on mainnet
- For production deployment, use environment variables on your hosting platform

---

## Demo Script (2 minutes)

1. Open `/audit` — paste a suspicious freelance contract
2. Show the risk score dashboard — point to the HIGH risk flags
3. Open `/escrow` — connect MetaMask, show funds locked in vault
4. Click Approve Milestone — show funds released on-chain
5. Open `/dispute` — fill in a sample dispute, show AI ruling

---

## Meet the Team

Built for **HACKRAX '26** — Department of Computer Science Engineering,
Thiagarajar College of Engineering, Madurai.

| Name | Role |
|---|---|
| Srimathi | Team Leader |
| Pavitra | Team Member |
| Dhiya | Team Member |
| Saravanan | Team Member |

---

## Links

- GitHub: [github.com/Saravana707/gigshield](https://github.com/Saravana707/gigshield)

---

## License

MIT License — feel free to use, modify and distribute.
