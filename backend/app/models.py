import time
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Council(Base):
    __tablename__ = "councils"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=True)
    created_at = Column(Integer, default=lambda: int(time.time() * 1000))
    social_structure = Column(String)
    token_total = Column(JSON, default=dict)
    judge = Column(JSON, nullable=True)
    mediator = Column(JSON, nullable=True)
    deliberation = Column(JSON, nullable=True)
    is_demo = Column(Boolean, default=False)
    
    seats = relationship("Seat", back_populates="council", cascade="all, delete-orphan")
    turns = relationship("Turn", back_populates="council", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"
    id = Column(String, primary_key=True, index=True)
    council_id = Column(String, ForeignKey("councils.id", ondelete="CASCADE"), index=True)
    model_id = Column(String)
    config = Column(JSON, default=dict)
    pos = Column(Integer, nullable=True)

    council = relationship("Council", back_populates="seats")

class Turn(Base):
    __tablename__ = "turns"
    id = Column(String, primary_key=True, index=True)
    council_id = Column(String, ForeignKey("councils.id", ondelete="CASCADE"), index=True)
    idx = Column(Integer)
    user_msg = Column(String)
    events = Column(JSON, default=list)
    token_total = Column(JSON, default=dict)
    voting_labels = Column(JSON, nullable=True)
    user_images = Column(JSON, nullable=True)
    run_state = Column(JSON, nullable=True)

    council = relationship("Council", back_populates="turns")

class ApiKey(Base):
    __tablename__ = "api_keys"
    provider = Column(String, primary_key=True, index=True)
    key = Column(String)

class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(JSON, default=dict)
