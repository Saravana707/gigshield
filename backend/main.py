from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
from pypdf import PdfReader
import io
import json
import os
from typing import Optional

app = FastAPI(title="GigShield API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# ─── Models ──────────────────────────────────────────────────────────────────

class RiskFlag(BaseModel):
    clause: str
    risk_level: str          # "HIGH" | "MEDIUM" | "LOW"
    explanation: str
    recommendation: str

class ContractAnalysis(BaseModel):
    overall_risk_score: int   # 0-100 (100 = most risky)
    summary: str
    flags: list[RiskFlag]
    payment_risk: int
    ip_risk: int
    liability_risk: int
    termination_risk: int
    worker_friendly: bool

class DisputeVerdict(BaseModel):
    ruling: str              # "FREELANCER" | "CLIENT" | "SPLIT"
    confidence: int          # 0-100
    reasoning: str
    recommended_split: Optional[int] = None  # % to freelancer if SPLIT

# ─── System Prompts ──────────────────────────────────────────────────────────

CONTRACT_SYSTEM_PROMPT = """You are GigShield's AI Legal Auditor — an expert in freelance contract law, 
labor rights, and gig economy regulations across India, the US, and Southeast Asia.

Analyze the provided contract and return a JSON object with this exact structure:
{
  "overall_risk_score": <integer 0-100, where 100 is extremely risky for the worker>,
  "summary": "<2-3 sentence plain-English summary of what this contract means for the worker>",
  "worker_friendly": <true if contract is reasonably fair, false if predatory>,
  "payment_risk": <integer 0-100>,
  "ip_risk": <integer 0-100>,
  "liability_risk": <integer 0-100>,
  "termination_risk": <integer 0-100>,
  "flags": [
    {
      "clause": "<exact or paraphrased clause text>",
      "risk_level": "<HIGH|MEDIUM|LOW>",
      "explanation": "<plain English explanation of why this is problematic>",
      "recommendation": "<specific action the worker should take>"
    }
  ]
}

Key things to flag:
- Payment terms longer than 30 days (industry standard) → HIGH risk
- IP ownership clauses that grab all work product including pre-existing work → HIGH risk
- Non-compete clauses that are overly broad (geography, duration, scope) → HIGH risk
- Unilateral termination without notice or payment → HIGH risk
- Unlimited liability or indemnification clauses → HIGH risk
- Missing dispute resolution mechanism → MEDIUM risk
- Vague deliverable definitions (grounds for non-payment) → MEDIUM risk
- Automatic renewal clauses with short opt-out windows → MEDIUM risk
- Missing confidentiality reciprocity → LOW risk

Return ONLY the JSON object, no other text."""

DISPUTE_SYSTEM_PROMPT = """You are GigShield's AI Mediator — a neutral arbitrator for freelance disputes.

You will receive:
1. The original contract terms
2. The freelancer's claim
3. The client's counter-claim
4. Any evidence descriptions

Return a JSON object:
{
  "ruling": "<FREELANCER|CLIENT|SPLIT>",
  "confidence": <integer 0-100>,
  "reasoning": "<3-5 sentence explanation of the ruling, citing specific contract clauses>",
  "recommended_split": <integer 0-100 representing % to freelancer, only if ruling is SPLIT>
}

Base your ruling strictly on:
1. What the contract says
2. What was demonstrably delivered
3. Industry standards for freelance work

Return ONLY the JSON object, no other text."""

# ─── Helpers ─────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore")

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "GigShield API running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=ContractAnalysis)
async def analyze_contract(file: UploadFile = File(...)):
    """
    Upload a contract PDF or TXT file and get a full risk analysis.
    """
    content = await file.read()

    # Extract text based on file type
    if file.filename.lower().endswith(".pdf"):
        contract_text = extract_text_from_pdf(content)
    elif file.filename.lower().endswith((".txt", ".md")):
        contract_text = extract_text_from_txt(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or TXT.")

    if len(contract_text) < 50:
        raise HTTPException(status_code=400, detail="Could not extract text from file. Try a different format.")

    # Truncate if extremely long (keep first 8000 chars to stay within context)
    if len(contract_text) > 8000:
        contract_text = contract_text[:8000] + "\n\n[Contract truncated for analysis]"

    # Call Claude
    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        system=CONTRACT_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Analyze this freelance contract:\n\n{contract_text}"
            }
        ]
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response. Try again.")

    return ContractAnalysis(**data)


@app.post("/analyze-text", response_model=ContractAnalysis)
async def analyze_contract_text(payload: dict):
    """
    Analyze a contract from raw pasted text.
    """
    contract_text = payload.get("text", "").strip()
    if len(contract_text) < 50:
        raise HTTPException(status_code=400, detail="Contract text too short.")

    if len(contract_text) > 8000:
        contract_text = contract_text[:8000] + "\n\n[Contract truncated for analysis]"

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        system=CONTRACT_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Analyze this freelance contract:\n\n{contract_text}"
            }
        ]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response.")

    return ContractAnalysis(**data)


@app.post("/dispute", response_model=DisputeVerdict)
async def resolve_dispute(payload: dict):
    """
    Submit a dispute for AI mediation.
    """
    contract_terms = payload.get("contract_terms", "")
    freelancer_claim = payload.get("freelancer_claim", "")
    client_claim = payload.get("client_claim", "")
    evidence = payload.get("evidence_description", "")

    if not all([contract_terms, freelancer_claim, client_claim]):
        raise HTTPException(status_code=400, detail="Missing required fields.")

    prompt = f"""CONTRACT TERMS:
{contract_terms}

FREELANCER'S CLAIM:
{freelancer_claim}

CLIENT'S COUNTER-CLAIM:
{client_claim}

EVIDENCE SUBMITTED:
{evidence or 'No additional evidence provided.'}"""

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        system=DISPUTE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response.")

    return DisputeVerdict(**data)
