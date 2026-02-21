import os
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from app.tools.graph_search import execute_graph_query
from app.services.neo4j_service import graph_service
from app.schema.state import GraphAgentState

# Tool Setup
graph_tools = [execute_graph_query]
graph_tool_node = ToolNode(graph_tools)

# Model: DeepSeek V3 (Deterministic for Cypher)
model = ChatOpenAI(
    model="deepseek/deepseek-chat",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base=os.getenv("OPENROUTER_BASE_URL"),
    temperature=0 # Critical for code/Cypher generation
).bind_tools(graph_tools)

# --- PRODUCTION PROMPT ---
LIBRARIAN_SYSTEM_PROMPT = """
You are the NexusAI Librarian, a specialist in Neo4j Graph Database retrieval.
Your goal: Answer the user's technical query by navigating the Knowledge Graph.

RULES:
1. SCHEMA AWARENESS: Use ONLY the labels and relationships provided in the schema context.
2. CYPHER GUARDRAILS: Never use DETACH, DELETE, SET, or REMOVE. Focus on MATCH and OPTIONAL MATCH.
3. SEMANTIC NAVIGATOR: Utilize the 'SEMANTIC_LINK' and 'HAS_CHUNK' relationships to connect disparate project concepts.
4. RECOVERY: If a query returns no results, try an 'OPTIONAL MATCH' or search for related keywords in node properties.
5. ITERATION: If you cannot find the answer in 3 attempts, report what you found and state the limitation.

SCHEMA CONTEXT:
{schema}
"""

def librarian_node(state: GraphAgentState):
    """The Librarian Thinking Step."""
    # 1. Self-Correction/Iteration Guardrail
    iterations = state.get("iterations", 0)
    if iterations > 3:
        return {"messages": [("assistant", "Maximum search iterations reached. Reporting best available data.")]}

    # 2. Inject Dynamic Schema
    current_schema = graph_service.get_schema()
    sys_msg = SystemMessage(content=LIBRARIAN_SYSTEM_PROMPT.format(schema=current_schema))
    
    # 3. Call V3
    response = model.invoke([sys_msg] + state["messages"])
    return {"messages": [response], "iterations": iterations + 1}

# --- GRAPH DEFINITION ---
builder = StateGraph(GraphAgentState)
builder.add_node("librarian", librarian_node)
builder.add_node("tools", graph_tool_node)

builder.add_edge(START, "librarian")
builder.add_conditional_edges("librarian", tools_condition)
builder.add_edge("tools", "librarian")
builder.add_edge("librarian", END)

graph_subgraph = builder.compile()