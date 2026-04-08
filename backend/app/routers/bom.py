"""
BOM streaming router — calls the LangGraph agent and streams SSE events.
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from ..agent.graph import build_bom_agent
from ..agent.state import BOMItem, AgentState

router = APIRouter(prefix="/bom", tags=["bom"])


class BOMRequest(BaseModel):
    message: str
    project_name: str = "未命名项目"
    current_parts: list[BOMItem] = []
    history: list[dict] = []


# Singleton compiled graph
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = build_bom_agent()
    return _agent


async def bom_event_generator(request: BOMRequest):
    """
    Runs the LangGraph agent and yields SSE events for each state transition.
    """
    agent = get_agent()

    initial_state: AgentState = {
        "user_message": request.message,
        "mode": "generate",
        "project_name": request.project_name,
        "current_parts": request.current_parts,
        "history": request.history,
        "reasoning": "",
        "phase": "idle",
        "result": None,
        "error": None,
    }

    thinking_buffer = ""
    thinking_done = False

    try:
        # Stream through the graph asynchronously
        async for event in agent.astream(initial_state, stream_mode="values"):
            phase = event.get("phase", "idle")

            if phase == "thinking" and not thinking_done:
                reasoning = event.get("reasoning", "")
                new_thinking = reasoning[len(thinking_buffer):]
                if new_thinking:
                    thinking_buffer += new_thinking
                    # Send thinking update
                    yield {
                        "event": "thinking",
                        "data": json.dumps({
                            "phase": "thinking",
                            "thinking": reasoning,
                        }, ensure_ascii=False),
                    }
                    # Small delay to allow frontend to render
                    await asyncio.sleep(0.05)

            elif phase == "searching":
                reasoning = event.get("reasoning", "")
                yield {
                    "event": "thinking",
                    "data": json.dumps({
                        "phase": "searching",
                        "thinking": reasoning or "正在搜索 LCSC 元件库…",
                    }, ensure_ascii=False),
                }
                await asyncio.sleep(0.1)

            elif phase == "generating":
                yield {
                    "event": "progress",
                    "data": json.dumps({
                        "phase": "generating",
                        "progress": "正在生成 BOM…",
                    }, ensure_ascii=False),
                }

            elif phase == "done":
                result = event.get("result")
                if result:
                    item_count = len(result.get("items", []))
                    total = result.get("totalCost", 0)
                    yield {
                        "event": "done",
                        "data": json.dumps({
                            "phase": "done",
                            "progress": f"✅ 生成完成！{item_count} 个元件，合计 ¥{total}",
                            "result": result,
                        }, ensure_ascii=False),
                    }
                return

            elif phase == "error":
                error = event.get("error", "未知错误")
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "phase": "error",
                        "error": error,
                    }, ensure_ascii=False),
                }
                return

    except Exception as e:
        yield {
            "event": "error",
            "data": json.dumps({"phase": "error", "error": str(e)}, ensure_ascii=False),
        }


@router.get("/stream")
async def bom_stream(request: BOMRequest):
    """
    SSE endpoint: GET /bom/stream?message=...&project_name=...
    Client can pass current_parts and history as JSON body (POST).
    """
    async def event_generator():
        try:
            async for event in bom_event_generator(request):
                yield event
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"phase": "error", "error": str(e)}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator())
