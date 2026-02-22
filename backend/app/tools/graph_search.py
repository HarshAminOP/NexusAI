import logging
from langchain_core.tools import tool
from langchain_core.callbacks.manager import dispatch_custom_event
from app.services.neo4j_service import graph_service

logger = logging.getLogger("GraphTool")

def format_neo4j_for_ui(results):
    """
    Transforms raw Neo4j list of dicts into {nodes, links} for React Force Graph.
    """
    nodes = []
    links = []
    node_ids = set()

    if not isinstance(results, list):
        return {"nodes": nodes, "links": links}

    for record in results:
        if isinstance(record, dict):
            for key, value in record.items():
                if isinstance(value, dict) and 'id' in value:
                    n_id = str(value['id'])
                    if n_id not in node_ids:
                        # Extract a label, defaulting to the ID if none exists
                        label = value.get('name', value.get('label', n_id))
                        nodes.append({"id": n_id, "label": label})
                        node_ids.add(n_id)

    return {"nodes": nodes, "links": links}

@tool
def execute_graph_query(cypher_query: str) -> str:
    """
    Execute a Cypher query against the NexusAI Neo4j Graph Database.
    
    Use this tool to:
    1. Find relationships between documents (SEMANTIC_LINK).
    2. Retrieve specific metadata for Chunks or Documents.
    3. Perform multi-hop reasoning across the knowledge graph.
    
    Current Schema available in the database:
    {schema_info}
    
    Input: A valid Cypher string.
    Output: A string representation of the query results or an error message.
    """
    logger.info(f"🤖 Agent executing Cypher: {cypher_query}")
    
    try:
        # Dispatch start log to UI
        dispatch_custom_event("nexus_stream", {"type": "log", "step": "NEO4J_QUERY_START", "status": "INFO"})
        
        results = graph_service.run_read_query(cypher_query)
        
        if not results:
            dispatch_custom_event("nexus_stream", {"type": "log", "step": "NEO4J_QUERY_EMPTY", "status": "WARNING"})
            return "No results found for that query. Try broadening your search or checking relationship types."
            
        if isinstance(results, list) and len(results) > 0 and "error" in results[0]:
            dispatch_custom_event("nexus_stream", {"type": "log", "step": "CYPHER_SYNTAX_ERROR", "status": "ERROR"})
            return f"Cypher Syntax Error: {results[0]['error']}. Please correct the query and try again."

        # Format and dispatch graph data to bypass LLM
        ui_graph = format_neo4j_for_ui(results)
        dispatch_custom_event("nexus_stream", {"type": "graph", "payload": ui_graph})
        dispatch_custom_event("nexus_stream", {"type": "log", "step": "GRAPH_FETCHED", "status": "SUCCESS"})

        return str(results)
        
    except Exception as e:
        dispatch_custom_event("nexus_stream", {"type": "log", "step": "NEO4J_SYSTEM_ERROR", "status": "ERROR"})
        return f"System Error executing graph search: {str(e)}"

# Dynamically inject schema into the docstring
try:
    schema = graph_service.get_schema()
    execute_graph_query.description = execute_graph_query.description.format(schema_info=schema)
except Exception:
    execute_graph_query.description = execute_graph_query.description.format(schema_info="Schema currently unavailable.")