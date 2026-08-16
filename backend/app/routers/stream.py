from fastapi import APIRouter

router = APIRouter(tags=["stream"])

@router.post("/run-turn")
async def run_turn():
    # TODO: Implement SSE streaming logic
    pass

@router.post("/stop")
async def stop_stream():
    pass
