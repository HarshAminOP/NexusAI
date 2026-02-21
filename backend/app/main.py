import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Annotated, List
from dotenv import load_dotenv

# FastAPI & AWS Bridge
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from mangum import Mangum

# LangChain / LangGraph Core
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END

# Project Modules
from app.agents.orchestrator import master_app  
from app.schema.state import OrchestratorState
from app.schema.api_models import ChatRequest

# Load Environment
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NexusAPI")
IS_AWS = os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

# ==========================================
# 1. RECURSIVE SUMMARIZATION
# ==========================================
from langchain_openai import ChatOpenAI
summarizer_llm = ChatOpenAI(
    model="openrouter/free",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base=os.getenv("OPENROUTER_BASE_URL"),
    temperature=0
)

def global_summarizer(state: OrchestratorState):
    messages = state["messages"]
    if len(messages) <= 10:
        return {"summary": state.get("summary", "")}

    summary_content = state.get("summary", "")
    prompt = (
        f"Current Summary: {summary_content}\n\n"
        "Synthesize the project history into a concise architectural summary, "
        "retaining all Neo4j graph findings and technical decisions."
    )
    response = summarizer_llm.invoke([SystemMessage(content=prompt)] + messages[:-3])
    return {"summary": response.content, "messages": messages[-3:]}

def run_orchestrator(state: OrchestratorState):
    return master_app.invoke(state)

# Define the workflow structure (Uncompiled)
workflow = StateGraph(OrchestratorState)
workflow.add_node("summarizer", global_summarizer)
workflow.add_node("orchestrator", run_orchestrator)
workflow.add_edge(START, "summarizer")
workflow.add_edge("summarizer", "orchestrator")
workflow.add_edge("orchestrator", END)

# ==========================================
# 2. LIFESPAN & PERSISTENCE (The Architect's Fix)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the database connection lifecycle based on the environment."""
    logger.info("🚀 Booting NexusAI Lifespan Manager...")
    
    if IS_AWS:
        # AWS ENVIRONMENT (DynamoDB)
        from langgraph_checkpoint_aws.dynamodb import DynamoDBSaver
        TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "NexusAI_Checkpoints")
        checkpointer = DynamoDBSaver(table_name=TABLE_NAME)
        logger.info("☁️ Connected to AWS DynamoDB Persistence")
        
        # Compile and store in global app state
        app.state.nexus_ai = workflow.compile(checkpointer=checkpointer)
        yield # Server runs here
        
    else:
        # LOCAL MAC ENVIRONMENT (Async SQLite)
        from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
        logger.info("💻 Booting Local Async SQLite Persistence")
        
        # The 'async with' keeps the DB open for the lifetime of the server
        async with AsyncSqliteSaver.from_conn_string("nexus_memory.sqlite") as checkpointer:
            # Compile and store in global app state
            app.state.nexus_ai = workflow.compile(checkpointer=checkpointer)
            yield # Server runs here

# ==========================================
# 3. FASTAPI APP & ROUTES
# ==========================================
app = FastAPI(title="NexusAI Production Gateway", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/chat/history/{thread_id}")
async def get_history(thread_id: str, fast_req: Request):
    """Retrieves the conversation history from the LangGraph checkpointer."""
    nexus_ai = fast_req.app.state.nexus_ai
    config = {"configurable": {"thread_id": thread_id}}
    
    # Fetch the state asynchronously from SQLite/DynamoDB
    state = await nexus_ai.aget_state(config)
    
    if not state.values or "messages" not in state.values:
        return {"messages": []}
        
    safe_messages = []
    for msg in state.values["messages"]:
        # We only want to send Human and AI messages to the UI (ignoring Tool messages)
        if msg.type == "human":
            safe_messages.append({"role": "user", "content": msg.content})
        elif msg.type == "ai":
            content = msg.content or ""
            thought = ""
            
            # Extract DeepSeek R1 <think> tags if they exist in the history
            if "<think>" in content:
                parts = content.split("</think>")
                thought = parts[0].replace("<think>", "").strip()
                content = parts[1].strip() if len(parts) > 1 else ""
                
            safe_messages.append({
                "role": "assistant",
                "content": content,
                "thought": thought
            })
            
    return {"messages": safe_messages}

@app.post("/chat/stream")
async def stream_chat(request: ChatRequest, fast_req: Request):
    """Streams the response using the globally compiled graph."""
    config = {"configurable": {"thread_id": request.thread_id}}
    input_data = {"messages": [HumanMessage(content=request.message)]}
    
    # Retrieve the compiled AI from the application state
    nexus_ai = fast_req.app.state.nexus_ai

    async def event_generator():
        try:
            async for event in nexus_ai.astream(input_data, config=config, stream_mode="updates"):
                if event:
                    for node_name, node_data in event.items():
                        if "messages" in node_data:
                            safe_messages = [
                                {"role": getattr(m, "type", "assistant"), "content": m.content}
                                for m in node_data["messages"]
                            ]
                            yield {
                                "event": "message",
                                "data": json.dumps({"node": node_name, "messages": safe_messages})
                            }
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield {
                "event": "error", 
                "data": json.dumps({"error": "Internal Brain Error"})
            }

    return EventSourceResponse(event_generator())

# --- AWS LAMBDA HANDLER ---
handler = Mangum(app, lifespan="off") # Mangum handles its own lifecycle in Lambda

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)