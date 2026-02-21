from typing import Annotated, List, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class OrchestratorState(TypedDict):
    """Master State for the R1 Orchestrator."""
    messages: Annotated[List[BaseMessage], add_messages]
    summary: str
    current_task: Optional[str]
    graph_report: Optional[str]

class GraphAgentState(TypedDict):
    """Specialized State for the Librarian (Sub-Graph)."""
    messages: Annotated[List[BaseMessage], add_messages]
    query: str  # The specific technical question to answer
    schema: str # Injected schema for Cypher accuracy
    iterations: int # Guardrail: prevent infinite loops