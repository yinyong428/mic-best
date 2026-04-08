"""
AgentState — shared state for the LangGraph BOM agent.
"""

from typing import Literal
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class BOMItem(TypedDict):
    name: str
    quantity: int
    description: str
    category: str
    unitCost: float
    supplier: str
    partNumber: str
    lcscId: str
    hqPartNumber: str


class AgentState(TypedDict):
    # User input
    user_message: str

    # Conversation context
    mode: Literal["generate", "modify"]
    project_name: str
    current_parts: list[BOMItem]
    history: list[dict]  # [{role, content}]

    # Agent reasoning
    reasoning: str  # "thinking" output streamed to frontend
    phase: Literal["idle", "thinking", "searching", "generating", "done", "error"]

    # Final output
    result: dict | None  # BOMResult
    error: str | None
