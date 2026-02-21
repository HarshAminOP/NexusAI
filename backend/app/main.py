import os
import json
import logging
from typing import Annotated, List
from dotenv import load_dotenv

# FastAPI & AWS Bridge
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from mangum import Mangum

# LangChain / LangGraph Core
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph, START, END

# Project Modules
from app.agents.orchestrator import master_app  # The Phase 2 R1 Brain
from app.schema.state import OrchestratorState
from app.schema.api_models import ChatRequest
from app.services.neo4j_service import graph_service

# Load Environment
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NexusAPI")

app = FastAPI(title="NexusAI Production Gateway")

# --- 1. ENVIRONMENT & PERSISTENCE (Phase 1 Logic) ---
IS_AWS = os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
try:
    from langgraph_checkpoint_aws.dynamodb import DynamoDBSaver
except ImportError:
    DynamoDBSaver = None

if IS_AWS and DynamoDBSaver:
    TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "NexusAI_Checkpoints")
    checkpointer = DynamoDBSaver(table_name=TABLE_NAME)
    logger.info("☁️ Using AWS DynamoDB Persistence")
else:
    checkpointer = SqliteSaver.from_conn_string("nexus_memory.sqlite")
    logger.info("🚀 Using Local SQLite Persistence")

# --- 2. RECURSIVE SUMMARIZATION (Phase 1 Logic) ---
from langchain_openai import ChatOpenAI
summarizer_llm = ChatOpenAI(
    model="deepseek/deepseek-chat",
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

# --- 3. ORCHESTRATION WRAPPER ---
def run_orchestrator(state: OrchestratorState):
    # This calls the R1 -> Librarian -> R1 Subgraph from orchestrator.py
    return master_app.invoke(state)

# --- 4. GRAPH COMPILATION ---
workflow = StateGraph(OrchestratorState)
workflow.add_node("summarizer", global_summarizer)
workflow.add_node("orchestrator", run_orchestrator)
workflow.add_edge(START, "summarizer")
workflow.add_edge("summarizer", "orchestrator")
workflow.add_edge("orchestrator", END)

nexus_ai = workflow.compile(checkpointer=checkpointer)

# --- 5. API ENDPOINTS & STREAMING ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat/stream")
async def stream_chat(request: ChatRequest):
    config = {"configurable": {"thread_id": request.thread_id}}
    input_data = {"messages": [HumanMessage(content=request.message)]}

    async def event_generator():
        # astreams through the global summarizer AND the orchestrator
        async for event in nexus_ai.astream(input_data, config=config, stream_mode="updates"):
            if event:
                yield {
                    "event": "message",
                    "data": json.dumps(event)
                }

    return EventSourceResponse(event_generator())

# --- 6. AWS LAMBDA HANDLER ---
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)