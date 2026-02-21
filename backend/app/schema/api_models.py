from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class ChatRequest(BaseModel):
    message: str = Field(..., example="What are the semantic links in the graph?")
    thread_id: str = Field(default="default_session", description="Used for persistent memory")
    metadata: Optional[Dict] = None

class ChatResponse(BaseModel):
    # This structure is used for non-streaming fallback
    answer: str
    thread_id: str
    thought: Optional[str] = None