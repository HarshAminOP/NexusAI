import os
from typing import Annotated, List, Union, Optional
from typing_extensions import TypedDict
from dotenv import load_dotenv

# LangChain Core
from langchain_openai import ChatOpenAI
from langchain_core.messages import (
    BaseMessage, 
    HumanMessage, 
    AIMessage, 
    SystemMessage, 
    trim_messages
)

# LangGraph Core
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# Persistence Drivers (Ensure these are installed via pip)
from langgraph.checkpoint.sqlite import SqliteSaver
try:
    from langgraph_checkpoint_aws.dynamodb import DynamoDBSaver
except ImportError:
    # Fallback for local dev if AWS driver isn't installed yet
    DynamoDBSaver = None

# ==========================================
# 1. ENVIRONMENT & IDENTITY (Rule #4 & #8)
# ==========================================

load_dotenv()
IS_AWS = os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

# The "Permanent Identity" of NexusAI
NEXUS_SYSTEM_PROMPT = (
    "You are NexusAI, a high-performance Multimodal Graphical RAG System. "
    "Tech Stack: Next.js, Python, LangGraph, Neo4j, and AWS. "
    "Persona: Professional, technical, and architectural. "
    "Memory: You have access to a recursive summary of previous interactions."
)

# ==========================================
# 2. PERSISTENCE ABSTRACTION (The Switch)
# ==========================================

if IS_AWS and DynamoDBSaver:
    TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "NexusAI_Checkpoints")
    checkpointer = DynamoDBSaver(table_name=TABLE_NAME)
    print(f"☁️ Persistence: AWS DynamoDB ({TABLE_NAME})")
else:
    # On your Mac ARM, we use SQLite for zero-config persistence
    memory_db = SqliteSaver.from_conn_string("nexus_memory.sqlite")
    checkpointer = memory_db
    print("🚀 Persistence: Local SQLite (nexus_memory.sqlite)")

# ==========================================
# 3. STATE DEFINITION (The "Shared Notebook")
# ==========================================

class AgentState(TypedDict):
    """
    Technically managing the balance between context density and token cost.
    """
    # Public Chat History (The list users see)
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Permanent compressed memory
    summary: str
    
    # Internal Scratchpad (Separated from public chat)
    intermediate_steps: List[str]

# ==========================================
# 4. MODEL INITIALIZATION (Hybrid Logic)
# ==========================================

OPENROUTER_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
API_KEY = os.getenv("OPENROUTER_API_KEY")

# The Architect (Reasoning)
reasoning_llm = ChatOpenAI(
    model="deepseek/deepseek-r1",
    openai_api_key=API_KEY,
    openai_api_base=OPENROUTER_URL,
)

# The Clerk (Execution & Summarization)
tool_llm = ChatOpenAI(
    model="deepseek/deepseek-chat", # DeepSeek V3
    openai_api_key=API_KEY, 
    openai_api_base=OPENROUTER_URL,
    temperature=0
)

# ==========================================
# 5. NODES (The Logic Steps)
# ==========================================

def summarizer_node(state: AgentState):
    """
    RECURSIVE MEMORY: Compresses history if it exceeds 6 messages.
    Ensures 'Long-term' memory without context window bloat.
    """
    messages = state["messages"]
    if len(messages) <= 6:
        return {"summary": state.get("summary", "")}

    summary_content = state.get("summary", "")
    prompt = (
        f"Current Summary: {summary_content}\n\n"
        "Incorporate the following new messages into a concise, technical update "
        "to the running summary, preserving all project context and architecture decisions."
    )
    
    # We summarize older messages, keeping the last 3 for immediate context
    response = tool_llm.invoke([SystemMessage(content=prompt)] + messages[:-3])
    
    # We return the new summary and 'truncate' the messages in the state
    return {
        "summary": response.content,
        "messages": messages[-3:] 
    }

def brain_node(state: AgentState):
    """
    REASONING: The core thinking step using DeepSeek R1.
    """
    summary = state.get("summary", "")
    
    # Injecting identity + historical summary into the prompt
    full_system_prompt = (
        f"{NEXUS_SYSTEM_PROMPT}\n\n"
        f"CONTEXT SUMMARY: {summary if summary else 'No previous history.'}"
    )
    
    payload = [SystemMessage(content=full_system_prompt)] + state["messages"]
    response = reasoning_llm.invoke(payload)
    
    return {"messages": [response]}

# ==========================================
# 6. GRAPH CONSTRUCTION
# ==========================================

workflow = StateGraph(AgentState)

workflow.add_node("summarizer", summarizer_node)
workflow.add_node("brain", brain_node)

# Flow: Always attempt to summarize before reasoning
workflow.add_edge(START, "summarizer")
workflow.add_edge("summarizer", "brain")
workflow.add_edge("brain", END)

# Compile with the Checkpointer for automatic DB saving
app = workflow.compile(checkpointer=checkpointer)

# ==========================================
# 7. LOCAL TEST EXECUTION
# ==========================================

if __name__ == "__main__":
    # Test execution with a specific Thread ID for persistence
    config = {"configurable": {"thread_id": "architect_session_001"}}
    
    # Sample Input
    inputs = {"messages": [HumanMessage(content="Initialize system check. Who are you?")]}
    
    print("\n--- NexusAI Phase 1 Boot ---")
    for output in app.stream(inputs, config=config):
        for node, value in output.items():
            print(f"\n[Node: {node}]")
            if "messages" in value:
                print(f"Response: {value['messages'][-1].content}")
    print("\n--- End of Stream ---")