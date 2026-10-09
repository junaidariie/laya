import json

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.LangGraph_service import support_graph


app = FastAPI(
    title="Laya AI Customer Support"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request model
# ============================================================

class ChatRequest(BaseModel):

    message: str


# ============================================================
# Health check
# ============================================================

@app.get("/")
def root():

    return {
        "status": "running",
        "service": "Laya AI Customer Support"
    }


# ============================================================
# Streaming endpoint
# ============================================================

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):

    async def event_generator():

        initial_state = {
            "user_message": request.message
        }

        try:

            async for event in support_graph.astream(
                initial_state
            ):

                # Send every state update
                yield (
                    f"data: "
                    f"{json.dumps(event)}"
                    f"\n\n"
                )

            # End signal
            yield "data: [DONE]\n\n"

        except Exception as e:

            error = {
                "error": str(e)
            }

            yield (
                f"data: "
                f"{json.dumps(error)}"
                f"\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )