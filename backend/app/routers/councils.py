from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Council, Seat, Turn
from app.schemas import CouncilCreate, CouncilRead, CouncilUpdate, SeatCreate, TurnCreate
from typing import List

router = APIRouter(tags=["councils"])

def serialize_turn(t: Turn) -> dict:
    return {
        "id": t.id, "councilId": t.council_id, "idx": t.idx, "userMsg": t.user_msg, 
        "events": t.events, "tokenTotal": t.token_total, "votingLabels": t.voting_labels, 
        "userImages": t.user_images, "runState": t.run_state
    }

def serialize_seat(s: Seat) -> dict:
    return {
        "id": s.id, "councilId": s.council_id, "modelId": s.model_id, 
        "config": s.config, "pos": s.pos
    }

def serialize_council(c: Council) -> dict:
    return {
        "id": c.id, "title": c.title, "createdAt": c.created_at, "socialStructure": c.social_structure,
        "tokenTotal": c.token_total, "judge": c.judge, "mediator": c.mediator,
        "deliberation": c.deliberation, "isDemo": c.is_demo,
        "seats": [serialize_seat(s) for s in c.seats],
        "turns": [serialize_turn(t) for t in c.turns]
    }

@router.get("", response_model=List[CouncilRead])
async def list_councils(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Council).order_by(Council.created_at.desc()).options(selectinload(Council.seats), selectinload(Council.turns)))
    councils = result.scalars().all()
    return [serialize_council(c) for c in councils]

@router.post("", response_model=CouncilRead)
async def create_council(payload: CouncilCreate, db: AsyncSession = Depends(get_db)):
    c = Council(
        id=payload.id, title=payload.title, social_structure=payload.socialStructure,
        judge=payload.judge, mediator=payload.mediator, deliberation=payload.deliberation,
        is_demo=payload.isDemo
    )
    db.add(c)
    for seat in payload.seats:
        s = Seat(id=seat.id, council_id=c.id, model_id=seat.modelId, config=seat.config, pos=seat.pos)
        db.add(s)
    await db.commit()
    result = await db.execute(select(Council).where(Council.id == c.id).options(selectinload(Council.seats), selectinload(Council.turns)))
    return serialize_council(result.scalar_one())

@router.get("/{council_id}", response_model=CouncilRead)
async def get_council(council_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Council).where(Council.id == council_id).options(selectinload(Council.seats), selectinload(Council.turns)))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_council(c)

@router.patch("/{council_id}", response_model=CouncilRead)
async def update_council(council_id: str, payload: CouncilUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Council).where(Council.id == council_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404)
    if payload.title is not None:
        c.title = payload.title
    if payload.judge is not None:
        c.judge = payload.judge
    if payload.mediator is not None:
        c.mediator = payload.mediator
    if payload.deliberation is not None:
        c.deliberation = payload.deliberation
    await db.commit()
    return await get_council(council_id, db)

@router.delete("/{council_id}")
async def delete_council(council_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Council).where(Council.id == council_id))
    c = result.scalar_one_or_none()
    if c:
        await db.delete(c)
        await db.commit()
    return {"status": "ok"}

@router.post("/{council_id}/seats")
async def add_seat(council_id: str, payload: SeatCreate, db: AsyncSession = Depends(get_db)):
    s = Seat(id=payload.id, council_id=council_id, model_id=payload.modelId, config=payload.config, pos=payload.pos)
    db.add(s)
    await db.commit()
    return {"status": "ok"}

@router.patch("/{council_id}/seats/{seat_id}")
async def update_seat(council_id: str, seat_id: str, payload: SeatCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seat).where(Seat.id == seat_id, Seat.council_id == council_id))
    s = result.scalar_one_or_none()
    if s:
        s.model_id = payload.modelId
        s.config = payload.config
        await db.commit()
    return {"status": "ok"}

@router.delete("/{council_id}/seats/{seat_id}")
async def delete_seat(council_id: str, seat_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seat).where(Seat.id == seat_id, Seat.council_id == council_id))
    s = result.scalar_one_or_none()
    if s:
        await db.delete(s)
        await db.commit()
    return {"status": "ok"}

@router.post("/{council_id}/turns")
async def append_turn(council_id: str, payload: TurnCreate, db: AsyncSession = Depends(get_db)):
    t = Turn(
        id=payload.id, council_id=council_id, idx=payload.idx, user_msg=payload.userMsg,
        events=payload.events, token_total=payload.tokenTotal, voting_labels=payload.votingLabels,
        user_images=payload.userImages, run_state=payload.runState
    )
    db.add(t)
    await db.commit()
    return {"status": "ok"}

@router.patch("/{council_id}/turns/{turn_id}")
async def update_turn(council_id: str, turn_id: str, payload: TurnCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Turn).where(Turn.id == turn_id, Turn.council_id == council_id))
    t = result.scalar_one_or_none()
    if t:
        t.events = payload.events
        t.token_total = payload.tokenTotal
        t.run_state = payload.runState
        if payload.votingLabels is not None:
            t.voting_labels = payload.votingLabels
        await db.commit()
    return {"status": "ok"}

@router.delete("/{council_id}/turns/{turn_id}")
async def delete_turn(council_id: str, turn_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Turn).where(Turn.id == turn_id, Turn.council_id == council_id))
    t = result.scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()
    return {"status": "ok"}
