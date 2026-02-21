import os
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.schema.state import OrchestratorState, GraphAgentState
from app.agents.graph_agent import graph_subgraph

# Planner: DeepSeek R1 (High Reasoning)
planner_llm = ChatOpenAI(
    model="deepseek/deepseek-r1",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base=os.getenv("OPENROUTER_BASE_URL"),
)

ORCHESTRATOR_PROMPT = """
You are the NexusAI Lead Architect. You manage a multimodal RAG system.
Your stack: Next.js, FastAPI, Neo4j, AWS.

WORKFLOW:
1. ANALYSIS: Deconstruct the user's query.
2. DELEGATION: If the query requires technical facts from the project docs or graph, delegate to the 'Librarian'.
3. SYNTHESIS: Combine the Librarian's findings with your architectural knowledge to provide a Senior-level response.

Current Project Context: NexusAI Lifecycle-Aware Ingestion Pipeline.
"""

def planner_node(state: OrchestratorState):
    """R1 Thinking and Decision Step."""
    sys_msg = SystemMessage(content=ORCHESTRATOR_PROMPT)
    response = planner_llm.invoke([sys_msg] + state["messages"])
    return {"messages": [response]}

def researcher_node(state: OrchestratorState):
    """The Bridge to the Librarian Sub-Graph."""
    # Extract the core technical question from the R1 plan
    last_thought = state["messages"][-1].content
    
    # Invoke Sub-Graph (Sub-graph has its own local memory)
    # We pass the R1 thought as the Librarian's starting query
    result = graph_subgraph.invoke({
        "query": last_thought, 
        "messages": [HumanMessage(content=f"Research this: {last_thought}")],
        "iterations": 0
    })
    
    # Store the Librarian's findings in the Master State
    report = result["messages"][-1].content
    return {"graph_report": report, "messages": [("assistant", f"GRAPH REPORT: {report}")]}

# --- MASTER GRAPH ---
master = StateGraph(OrchestratorState)
master.add_node("planner", planner_node)
master.add_node("librarian_research", researcher_node)

master.add_edge(START, "planner")

# Conditional: If R1 says it needs research, go to librarian
def route_planner(state: OrchestratorState):
    content = state["messages"][-1].content.lower()
    if "research" in content or "graph" in content or "query" in content:
        return "librarian_research"
    return END

master.add_conditional_edges("planner", route_planner)
master.add_edge("librarian_research", "planner") # Loop back for R1 to synthesize report

master_app = master.compile()