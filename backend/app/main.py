from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import councils, keys, stream, settings

app = FastAPI(title="YesBrainer Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(councils.router, prefix="/api/councils")
app.include_router(keys.router, prefix="/api/keys")
app.include_router(settings.router, prefix="/api/settings")
app.include_router(stream.router, prefix="/api/stream")

@app.get("/api/health")
def health():
    return {"status": "ok"}
