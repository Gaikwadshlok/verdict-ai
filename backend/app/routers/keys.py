from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import ApiKey
from app.schemas import ApiKeySet, ApiKeyRead
from typing import List

router = APIRouter(tags=["keys"])

@router.get("", response_model=List[ApiKeyRead])
async def list_keys(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey))
    keys = result.scalars().all()
    return [{"provider": k.provider, "maskedKey": k.key} for k in keys]

@router.put("/{provider}")
async def set_key(provider: str, payload: ApiKeySet, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.provider == provider))
    db_key = result.scalar_one_or_none()
    if db_key:
        db_key.key = payload.key
    else:
        db_key = ApiKey(provider=provider, key=payload.key)
        db.add(db_key)
    await db.commit()
    return {"status": "ok"}

@router.delete("/{provider}")
async def delete_key(provider: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.provider == provider))
    db_key = result.scalar_one_or_none()
    if db_key:
        await db.delete(db_key)
        await db.commit()
    return {"status": "ok"}
