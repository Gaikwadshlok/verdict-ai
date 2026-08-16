from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class SeatCreate(BaseModel):
    id: str
    modelId: str
    config: Dict[str, Any]
    pos: Optional[int] = None

class SeatRead(SeatCreate):
    councilId: str
    model_config = ConfigDict(from_attributes=True)

class TurnCreate(BaseModel):
    id: str
    idx: int
    userMsg: str
    events: List[Dict[str, Any]] = []
    tokenTotal: Dict[str, Any] = {"inputTokens": 0, "outputTokens": 0}
    votingLabels: Optional[Dict[str, str]] = None
    userImages: Optional[List[str]] = None
    runState: Optional[Dict[str, Any]] = None

class TurnRead(TurnCreate):
    councilId: str
    model_config = ConfigDict(from_attributes=True)

class CouncilCreate(BaseModel):
    id: str
    title: Optional[str] = None
    socialStructure: str
    seats: List[SeatCreate] = []
    judge: Optional[Dict[str, Any]] = None
    mediator: Optional[Dict[str, Any]] = None
    deliberation: Optional[Dict[str, Any]] = None
    isDemo: Optional[bool] = False

class CouncilRead(BaseModel):
    id: str
    title: Optional[str] = None
    createdAt: int
    socialStructure: str
    tokenTotal: Dict[str, Any] = {"inputTokens": 0, "outputTokens": 0}
    judge: Optional[Dict[str, Any]] = None
    mediator: Optional[Dict[str, Any]] = None
    deliberation: Optional[Dict[str, Any]] = None
    isDemo: Optional[bool] = False
    seats: List[SeatRead] = []
    turns: List[TurnRead] = []
    model_config = ConfigDict(from_attributes=True)

class CouncilUpdate(BaseModel):
    title: Optional[str] = None
    judge: Optional[Dict[str, Any]] = None
    mediator: Optional[Dict[str, Any]] = None
    deliberation: Optional[Dict[str, Any]] = None

class ApiKeySet(BaseModel):
    key: str

class ApiKeyRead(BaseModel):
    provider: str
    maskedKey: str

class SettingSet(BaseModel):
    value: Dict[str, Any]

class SettingRead(BaseModel):
    key: str
    value: Dict[str, Any]
