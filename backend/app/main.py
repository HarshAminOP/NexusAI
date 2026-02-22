import os
import json
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# FastAPI & AWS Bridge
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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

workflow = StateGraph(OrchestratorState)
workflow.add_node("summarizer", global_summarizer)
workflow.add_node("orchestrator", run_orchestrator)
workflow.add_edge(START, "summarizer")
workflow.add_edge("summarizer", "orchestrator")
workflow.add_edge("orchestrator", END)

# ==========================================
# 2. LIFESPAN & PERSISTENCE
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Booting NexusAI Lifespan Manager...")
    
    if IS_AWS:
        from langgraph_checkpoint_aws.dynamodb import DynamoDBSaver
        TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "NexusAI_Checkpoints")
        checkpointer = DynamoDBSaver(table_name=TABLE_NAME)
        logger.info("☁️ Connected to AWS DynamoDB Persistence")
        app.state.nexus_ai = workflow.compile(checkpointer=checkpointer)
        yield 
    else:
        from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
        logger.info("💻 Booting Local Async SQLite Persistence")
        async with AsyncSqliteSaver.from_conn_string("nexus_memory.sqlite") as checkpointer:
            app.state.nexus_ai = workflow.compile(checkpointer=checkpointer)
            yield 

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
    nexus_ai = fast_req.app.state.nexus_ai
    config = {"configurable": {"thread_id": thread_id}}
    state = await nexus_ai.aget_state(config)
    
    if not state.values or "messages" not in state.values:
        return {"messages": []}
        
    safe_messages = []
    for msg in state.values["messages"]:
        if msg.type == "human":
            safe_messages.append({"role": "user", "content": msg.content})
        elif msg.type == "ai":
            content = msg.content or ""
            thought = ""
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
    config = {"configurable": {"thread_id": request.thread_id}}
    input_data = {"messages": [HumanMessage(content=request.message)]}
    nexus_ai = fast_req.app.state.nexus_ai

    async def event_generator():
        try:
            # Emit initialization log
            yield f"data: {json.dumps({'type': 'log', 'step': 'SYS_INIT', 'status': 'INFO'})}\n\n"
            
            # Use astream_events (v2) to catch tokens and custom dispatched events
            async for event in nexus_ai.astream_events(input_data, config=config, version="v2"):
                kind = event["event"]
                
                # 1. Catch LLM Tokens
                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        yield f"data: {json.dumps({'type': 'text', 'content': content})}\n\n"
                
                # 2. Catch Custom Events (Graph payloads and specific logs from tools)
                elif kind == "on_custom_event" and event["name"] == "nexus_stream":
                    yield f"data: {json.dumps(event['data'])}\n\n"
                
                # 3. Catch Node Completions for UI Observability
                elif kind == "on_chain_end":
                    # Filter for actual nodes in the graph
                    tags = event.get("tags", [])
                    if "graph:node" in tags:
                        node_name = event["name"]
                        if node_name not in ["__start__", "__end__"]:
                            yield f"data: {json.dumps({'type': 'log', 'step': f'{node_name.upper()}_COMPLETE', 'status': 'SUCCESS'})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield f"data: {json.dumps({'type': 'log', 'step': 'STREAM_ERROR', 'status': 'ERROR'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- AWS LAMBDA HANDLER ---
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)