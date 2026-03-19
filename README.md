# GigShield — The Gig-Worker Advocate Portal

> AI + Blockchain giving every freelancer a digital lawyer and a payment vault.

---

## Project Structure

```
gigshield/
├── backend/          ← FastAPI + Claude AI (Python)
├── contracts/        ← Solidity + Hardhat (Blockchain)
└── frontend/         ← Next.js 14 + Tailwind (UI)
```

---

## Quick Start (Run everything locally)

### Step 1 — Backend (AI Contract Analyzer)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

---

### Step 2 — Smart Contract (Blockchain Escrow)

```bash
cd contracts

# Install dependencies
npm install

# Start a local Hardhat blockchain node
npx hardhat node

# In a new terminal — deploy the contract
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address — you'll need it for the frontend.

To deploy to Polygon Mumbai testnet:
```bash
# Add to contracts/.env:
PRIVATE_KEY=your_wallet_private_key
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com

npx hardhat run scripts/deploy.js --network polygonMumbai
```

Get free Mumbai MATIC from: https://faucet.polygon.technology

---

### Step 3 — Frontend (Next.js UI)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_deployed_address

# Start the dev server
npm run dev
```

Frontend runs at: http://localhost:3000

---

## API Endpoints

| Method | Endpoint        | Description                          |
|--------|----------------|--------------------------------------|
| GET    | /health         | Health check                         |
| POST   | /analyze        | Upload PDF/TXT contract for analysis |
| POST   | /analyze-text   | Analyze pasted contract text         |
| POST   | /dispute        | Submit dispute for AI mediation      |

### Example: Analyze a contract
```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@my_contract.pdf"
```

### Example: Analyze pasted text
```bash
curl -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "This agreement states that payment will be made within 90 days..."}'
```

### Example: Dispute mediation
```bash
curl -X POST http://localhost:8000/dispute \
  -H "Content-Type: application/json" \
  -d '{
    "contract_terms": "Payment due within 30 days of delivery...",
    "freelancer_claim": "I delivered all work on time. 45 days have passed.",
    "client_claim": "The work does not meet our quality standards.",
    "evidence_description": "Git commits showing all features delivered"
  }'
```

---

## Smart Contract — GigShieldEscrow.sol

### Contract flow

```
AWAITING_PAYMENT
      ↓  client.deposit()
   FUNDED
      ↓  freelancer.startWork()
  IN_PROGRESS
      ↓  freelancer.submitMilestone()
MILESTONE_REVIEW
      ↓  client.approveMilestone()
  IN_PROGRESS  (repeat per milestone)
      ↓  final milestone approved
  COMPLETED

At any funded/in-progress stage:
      ↓  either party.raiseDispute(evidenceCID)
  DISPUTED
      ↓  arbiter.resolveDispute(freelancerBps)
  COMPLETED
```

### Key functions

| Function | Who calls it | What it does |
|----------|-------------|--------------|
| `deposit()` | Client | Locks full payment in escrow |
| `startWork()` | Freelancer | Confirms work has begun |
| `submitMilestone()` | Freelancer | Submits milestone for review |
| `approveMilestone()` | Client | Approves + releases proportional funds |
| `raiseDispute(cid)` | Either party | Locks funds, pins evidence CID |
| `resolveDispute(bps)` | Arbiter | Splits funds per AI ruling |
| `getContractInfo()` | Anyone | Returns full contract state |

---

## Pages

| Route      | What it does                                    |
|------------|-------------------------------------------------|
| `/`        | Homepage with project overview                 |
| `/audit`   | Upload/paste contract → AI risk score          |
| `/escrow`  | Connect wallet → manage escrow vault           |
| `/dispute` | Submit dispute → AI mediation verdict          |

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 14, TailwindCSS, ethers.js, shadcn/ui |
| AI Backend | FastAPI, Claude API (claude-sonnet-4-5), PyMuPDF |
| Blockchain | Solidity 0.8+, Hardhat, Polygon Mumbai        |
| Storage    | Supabase (auth), web3.storage (IPFS)          |

---

## Hackathon Build Order

1. **Hour 1–2**: Get `/analyze` endpoint working with Claude. Test on a real contract.
2. **Hour 2–3**: Wire up the `/audit` frontend page end-to-end.
3. **Hour 3–5**: Deploy the Solidity contract, connect MetaMask on `/escrow`.
4. **Hour 5–6**: Polish UI, connect all three pages into one smooth flow.
5. **Hour 6–7**: Add IPFS evidence upload on `/dispute` page.
6. **Hour 7–8**: Demo prep — rehearse the happy path.

---

## Demo Script (2 minutes)

1. Open `/audit` — paste a suspicious freelance contract
2. Show the risk score dashboard — point to the red HIGH flags
3. Open `/escrow` — connect MetaMask, show funds "locked" status
4. Click "Approve Milestone" — show funds released on-chain
5. Open `/dispute` — fill in a sample dispute, show AI ruling

---

## Environment Variables

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### Contracts (.env)
```
PRIVATE_KEY=0x...
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
POLYGONSCAN_API_KEY=...
```
