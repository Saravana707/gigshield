# GigShield — The Gig-Worker Advocate Portal

> AI + Blockchain giving every freelancer a digital lawyer and a payment vault.
> Built for HACKRAX '26 — Thiagarajar College of Engineering, Madurai

---

## Team

| Name | Role |
|---|---|
| Srimathi | Team Leader |
| Pavitra | Team Member |
| Dhiya | Team Member |
| Saravanan | Team Member |

---

## What is GigShield?

GigShield is a web platform that protects gig workers and freelancers by combining:

- **AI Legal Auditor** — Upload any contract and get an instant risk score with red flags explained in plain English
- **Smart Escrow Vault** — Client locks payment in a blockchain smart contract before work starts. Funds release automatically on milestone approval
- **Dispute Protocol** — If there is a disagreement, evidence is locked to IPFS and an AI mediator issues a fair ruling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TailwindCSS, ethers.js, MetaMask |
| AI Backend | FastAPI (Python), Google Gemini API |
| Blockchain | Solidity 0.8+, Hardhat, Polygon Mumbai |
| Storage | Supabase, IPFS via web3.storage |

---

## Quick Start

### Requirements

- Python 3.12+
- Node.js 18+
- Git
- MetaMask browser extension

---

### Step 1 — Backend (AI Contract Analyzer)
```bash
cd backend
python -m venv venv
source venv/bin/activate.fish   # fish shell
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
GEMINI_API_KEY= AIzaSyDV6s6_hERflxE3p9qfVGW9Ij0NnYvqz7o
```

Get your free Gemini API key from: https://aistudio.google.com

Start the server:
```bash
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

---

### Step 2 — Smart Contract (Blockchain Escrow)
```bash
cd contracts
npm install
npx hardhat node
```

In a new terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address.

---

### Step 3 — Frontend
```bash
cd frontend
npm install
```

Create `.env.local` inside `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS

```

Start the frontend:
```bash
npm run dev
```

Frontend runs at: http://localhost:3000

---

## Running Everything Together

Open three terminals:
```
Terminal 1 — cd backend  && source venv/bin/activate.fish && uvicorn main:app --reload
Terminal 2 — cd contracts && npx hardhat node
Terminal 3 — cd frontend && npm run dev
```

---

## Pages

| Page | What it does |
|---|---|
| `/` | Homepage |
| `/audit` | Upload contract and get AI risk analysis |
| `/escrow` | Connect MetaMask and manage escrow vault |
| `/dispute` | Submit dispute for AI mediation |
| `/about` | About the team and project |

---

## Environment Variables

### backend/.env
```
GEMINI_API_KEY=AIzaSyDV6s6_hERflxE3p9qfVGW9Ij0NnYvqz7o
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### contracts/.env
```
PRIVATE_KEY=your_wallet_private_key
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
```

---

## Important

Never commit your `.env` files to GitHub. They are listed in `.gitignore` and must stay only on your local machine.
