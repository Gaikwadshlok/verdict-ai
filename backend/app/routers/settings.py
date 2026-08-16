from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Setting
from app.schemas import SettingSet, SettingRead
from typing import List, Dict, Any

router = APIRouter(tags=["settings"])

@router.get("", response_model=List[SettingRead])
async def list_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting))
    settings = result.scalars().all()
    return [{"key": s.key, "value": s.value} for s in settings]

@router.get("/{key}", response_model=SettingRead)
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting).where(Setting.key == key))
    s = result.scalar_one_or_none()
    return {"key": key, "value": s.value if s else {}}

@router.put("/{key}")
async def set_setting(key: str, payload: SettingSet, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting).where(Setting.key == key))
    s = result.scalar_one_or_none()
    if s:
        s.value = payload.value
    else:
        s = Setting(key=key, value=payload.value)
        db.add(s)
    await db.commit()
    return {"status": "ok"}
