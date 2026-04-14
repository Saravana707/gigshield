import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from database import Base


class UserRole(str, enum.Enum):
    CLIENT = "client"
    FREELANCER = "freelancer"


class JobStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # email used as unique ID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    image = Column(String)
    role = Column(SAEnum(UserRole), nullable=True)
    wallet_address = Column(String, nullable=True)
    provider = Column(String)  # "google" or "github"
    created_at = Column(DateTime, default=datetime.utcnow)

    jobs_posted = relationship("Job", back_populates="client", foreign_keys="Job.client_id")
    applications = relationship("Application", back_populates="freelancer")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    budget = Column(Float, nullable=False)
    budget_currency = Column(String, default="ETH")
    skills = Column(String)  # comma-separated
    status = Column(SAEnum(JobStatus), default=JobStatus.OPEN)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    freelancer_id = Column(String, ForeignKey("users.id"), nullable=True)
    deadline = Column(String, nullable=True)
    contract_address = Column(String, nullable=True)  # deployed escrow contract address
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("User", back_populates="jobs_posted", foreign_keys=[client_id])
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    freelancer_id = Column(String, ForeignKey("users.id"), nullable=False)
    proposal = Column(Text, nullable=False)
    bid_amount = Column(Float, nullable=True)
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    freelancer = relationship("User", back_populates="applications")
