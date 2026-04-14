from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
from pypdf import PdfReader
import io
import json
import os
from typing import Optional, List
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db, engine
import models

models.Base.metadata.create_all(bind=engine)

load_dotenv()

ai_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

app = FastAPI(title="GigShield API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class RiskFlag(BaseModel):
    clause: str
    risk_level: str
    explanation: str
    recommendation: str

class ContractAnalysis(BaseModel):
    overall_risk_score: int
    summary: str
    flags: list[RiskFlag]
    payment_risk: int
    ip_risk: int
    liability_risk: int
    termination_risk: int
    worker_friendly: bool

class DisputeVerdict(BaseModel):
    ruling: str
    confidence: int
    reasoning: str
    recommended_split: Optional[int] = None

class UserUpsert(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    image: Optional[str] = None
    provider: str

class UserUpdate(BaseModel):
    role: Optional[str] = None
    wallet_address: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    image: Optional[str]
    role: Optional[str]
    wallet_address: Optional[str]
    provider: str

    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    title: str
    description: str
    budget: float
    budget_currency: str = "ETH"
    skills: Optional[str] = None
    deadline: Optional[str] = None

class JobOut(BaseModel):
    id: int
    title: str
    description: str
    budget: float
    budget_currency: str
    skills: Optional[str]
    status: str
    client_id: str
    freelancer_id: Optional[str]
    deadline: Optional[str]
    contract_address: Optional[str]
    created_at: str
    client: Optional[UserOut]
    application_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    proposal: str
    bid_amount: Optional[float] = None

class ApplicationOut(BaseModel):
    id: int
    job_id: int
    freelancer_id: str
    proposal: str
    bid_amount: Optional[float]
    status: str
    created_at: str
    freelancer: Optional[UserOut]

    class Config:
        from_attributes = True

# ─── AI System Prompts ────────────────────────────────────────────────────────

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

Return ONLY the JSON object, no other text."""

DISPUTE_SYSTEM_PROMPT = """You are GigShield's AI Mediator — a neutral arbitrator for freelance disputes.

Return a JSON object:
{
  "ruling": "<FREELANCER|CLIENT|SPLIT>",
  "confidence": <integer 0-100>,
  "reasoning": "<3-5 sentence explanation>",
  "recommended_split": <integer 0-100, only if SPLIT>
}

Return ONLY the JSON object, no other text."""

# ─── AI Helpers ───────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages).strip()

def call_claude(system_prompt: str, user_message: str) -> str:
    message = ai_client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}]
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()

# ─── Health Routes ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "GigShield API running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ─── User Routes ──────────────────────────────────────────────────────────────

@app.post("/users/upsert", response_model=UserOut)
def upsert_user(payload: UserUpsert, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        user.name = payload.name or user.name
        user.image = payload.image or user.image
        user.provider = payload.provider
    else:
        user = models.User(
            id=payload.email,  # use email as stable ID
            email=payload.email,
            name=payload.name,
            image=payload.image,
            provider=payload.provider,
        )
        db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role is not None:
        user.role = payload.role
    if payload.wallet_address is not None:
        user.wallet_address = payload.wallet_address
    db.commit()
    db.refresh(user)
    return user

# ─── Job Routes ───────────────────────────────────────────────────────────────

@app.get("/jobs", response_model=List[JobOut])
def list_jobs(status: Optional[str] = "open", db: Session = Depends(get_db)):
    query = db.query(models.Job)
    if status:
        query = query.filter(models.Job.status == status)
    jobs = query.order_by(models.Job.created_at.desc()).all()
    result = []
    for job in jobs:
        job_data = JobOut(
            id=job.id,
            title=job.title,
            description=job.description,
            budget=job.budget,
            budget_currency=job.budget_currency,
            skills=job.skills,
            status=job.status.value if hasattr(job.status, 'value') else job.status,
            client_id=job.client_id,
            freelancer_id=job.freelancer_id,
            deadline=job.deadline,
            contract_address=job.contract_address,
            created_at=job.created_at.isoformat(),
            client=job.client,
            application_count=len(job.applications),
        )
        result.append(job_data)
    return result

@app.post("/jobs", response_model=JobOut)
def create_job(payload: JobCreate, client_id: str, db: Session = Depends(get_db)):
    client = db.query(models.User).filter(models.User.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    job = models.Job(
        title=payload.title,
        description=payload.description,
        budget=payload.budget,
        budget_currency=payload.budget_currency,
        skills=payload.skills,
        deadline=payload.deadline,
        client_id=client_id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return JobOut(
        id=job.id,
        title=job.title,
        description=job.description,
        budget=job.budget,
        budget_currency=job.budget_currency,
        skills=job.skills,
        status=job.status.value,
        client_id=job.client_id,
        freelancer_id=job.freelancer_id,
        deadline=job.deadline,
        contract_address=job.contract_address,
        created_at=job.created_at.isoformat(),
        client=job.client,
        application_count=0,
    )

@app.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobOut(
        id=job.id,
        title=job.title,
        description=job.description,
        budget=job.budget,
        budget_currency=job.budget_currency,
        skills=job.skills,
        status=job.status.value if hasattr(job.status, 'value') else job.status,
        client_id=job.client_id,
        freelancer_id=job.freelancer_id,
        deadline=job.deadline,
        contract_address=job.contract_address,
        created_at=job.created_at.isoformat(),
        client=job.client,
        application_count=len(job.applications),
    )

@app.put("/jobs/{job_id}/contract")
def set_contract_address(job_id: int, client_id: str, contract_address: str, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    job.contract_address = contract_address
    db.commit()
    return {"message": "Contract address saved", "contract_address": contract_address}

@app.put("/jobs/{job_id}/complete")
def complete_job(job_id: int, client_id: str, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    job.status = models.JobStatus.COMPLETED
    db.commit()
    return {"message": "Job marked as completed"}

# ─── Application Routes ───────────────────────────────────────────────────────

@app.get("/jobs/{job_id}/applications", response_model=List[ApplicationOut])
def get_applications(job_id: int, db: Session = Depends(get_db)):
    apps = db.query(models.Application).filter(models.Application.job_id == job_id).all()
    return [
        ApplicationOut(
            id=a.id,
            job_id=a.job_id,
            freelancer_id=a.freelancer_id,
            proposal=a.proposal,
            bid_amount=a.bid_amount,
            status=a.status.value if hasattr(a.status, 'value') else a.status,
            created_at=a.created_at.isoformat(),
            freelancer=a.freelancer,
        )
        for a in apps
    ]

@app.post("/jobs/{job_id}/apply", response_model=ApplicationOut)
def apply_for_job(job_id: int, freelancer_id: str, payload: ApplicationCreate, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != models.JobStatus.OPEN:
        raise HTTPException(status_code=400, detail="Job is not open for applications")
    existing = db.query(models.Application).filter(
        models.Application.job_id == job_id,
        models.Application.freelancer_id == freelancer_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already applied for this job")
    app_obj = models.Application(
        job_id=job_id,
        freelancer_id=freelancer_id,
        proposal=payload.proposal,
        bid_amount=payload.bid_amount,
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return ApplicationOut(
        id=app_obj.id,
        job_id=app_obj.job_id,
        freelancer_id=app_obj.freelancer_id,
        proposal=app_obj.proposal,
        bid_amount=app_obj.bid_amount,
        status=app_obj.status.value,
        created_at=app_obj.created_at.isoformat(),
        freelancer=app_obj.freelancer,
    )

@app.put("/applications/{app_id}/approve")
def approve_application(app_id: int, client_id: str, db: Session = Depends(get_db)):
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    job = application.job
    if job.client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    application.status = models.ApplicationStatus.APPROVED
    job.freelancer_id = application.freelancer_id
    job.status = models.JobStatus.IN_PROGRESS
    # Reject all other applications
    db.query(models.Application).filter(
        models.Application.job_id == job.id,
        models.Application.id != app_id,
    ).update({"status": models.ApplicationStatus.REJECTED})
    db.commit()
    return {"message": "Application approved, job is now in progress"}

@app.put("/applications/{app_id}/reject")
def reject_application(app_id: int, client_id: str, db: Session = Depends(get_db)):
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.job.client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    application.status = models.ApplicationStatus.REJECTED
    db.commit()
    return {"message": "Application rejected"}

# ─── User-scoped Routes ───────────────────────────────────────────────────────

@app.get("/users/{user_id}/posted-jobs", response_model=List[JobOut])
def get_posted_jobs(user_id: str, db: Session = Depends(get_db)):
    jobs = db.query(models.Job).filter(models.Job.client_id == user_id).order_by(models.Job.created_at.desc()).all()
    return [
        JobOut(
            id=j.id,
            title=j.title,
            description=j.description,
            budget=j.budget,
            budget_currency=j.budget_currency,
            skills=j.skills,
            status=j.status.value if hasattr(j.status, 'value') else j.status,
            client_id=j.client_id,
            freelancer_id=j.freelancer_id,
            deadline=j.deadline,
            contract_address=j.contract_address,
            created_at=j.created_at.isoformat(),
            client=j.client,
            application_count=len(j.applications),
        )
        for j in jobs
    ]

@app.get("/users/{user_id}/applications", response_model=List[ApplicationOut])
def get_user_applications(user_id: str, db: Session = Depends(get_db)):
    apps = db.query(models.Application).filter(
        models.Application.freelancer_id == user_id
    ).order_by(models.Application.created_at.desc()).all()
    return [
        ApplicationOut(
            id=a.id,
            job_id=a.job_id,
            freelancer_id=a.freelancer_id,
            proposal=a.proposal,
            bid_amount=a.bid_amount,
            status=a.status.value if hasattr(a.status, 'value') else a.status,
            created_at=a.created_at.isoformat(),
            freelancer=a.freelancer,
        )
        for a in apps
    ]

# ─── AI Contract Routes ───────────────────────────────────────────────────────

@app.post("/analyze", response_model=ContractAnalysis)
async def analyze_contract(file: UploadFile = File(...)):
    content = await file.read()
    if file.filename.lower().endswith(".pdf"):
        contract_text = extract_text_from_pdf(content)
    elif file.filename.lower().endswith((".txt", ".md")):
        contract_text = content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or TXT.")
    if len(contract_text) < 50:
        raise HTTPException(status_code=400, detail="Could not extract text from file.")
    if len(contract_text) > 8000:
        contract_text = contract_text[:8000] + "\n\n[Truncated]"
    try:
        raw = call_claude(CONTRACT_SYSTEM_PROMPT, f"Analyze this contract:\n\n{contract_text}")
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response.")
    return ContractAnalysis(**data)

@app.post("/analyze-text", response_model=ContractAnalysis)
async def analyze_contract_text(payload: dict):
    contract_text = payload.get("text", "").strip()
    if len(contract_text) < 50:
        raise HTTPException(status_code=400, detail="Contract text too short.")
    if len(contract_text) > 8000:
        contract_text = contract_text[:8000] + "\n\n[Truncated]"
    try:
        raw = call_claude(CONTRACT_SYSTEM_PROMPT, f"Analyze this contract:\n\n{contract_text}")
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response.")
    return ContractAnalysis(**data)

@app.post("/dispute", response_model=DisputeVerdict)
async def resolve_dispute(payload: dict):
    contract_terms = payload.get("contract_terms", "")
    freelancer_claim = payload.get("freelancer_claim", "")
    client_claim = payload.get("client_claim", "")
    evidence = payload.get("evidence_description", "")
    if not all([contract_terms, freelancer_claim, client_claim]):
        raise HTTPException(status_code=400, detail="Missing required fields.")
    prompt = f"CONTRACT:\n{contract_terms}\n\nFREELANCER:\n{freelancer_claim}\n\nCLIENT:\n{client_claim}\n\nEVIDENCE:\n{evidence or 'None'}"
    try:
        raw = call_claude(DISPUTE_SYSTEM_PROMPT, prompt)
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response.")
    return DisputeVerdict(**data)
