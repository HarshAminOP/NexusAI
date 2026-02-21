from langchain_core.tools import tool
from app.services.neo4j_service import graph_service
import logging

logger = logging.getLogger("GraphTool")

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
    # Note: The {schema_info} in the docstring is a placeholder. 
    # In a dynamic production app, we refresh this schema context.
    
    logger.info(f"🤖 Agent executing Cypher: {cypher_query}")
    
    try:
        # We call our AWS-friendly service
        results = graph_service.run_read_query(cypher_query)
        
        if not results:
            return "No results found for that query. Try broadening your search or checking relationship types."
            
        if isinstance(results, list) and len(results) > 0 and "error" in results[0]:
            return f"Cypher Syntax Error: {results[0]['error']}. Please correct the query and try again."

        # Convert the list of dicts into a readable string for the LLM
        return str(results)
        
    except Exception as e:
        return f"System Error executing graph search: {str(e)}"

# We manually update the docstring with real schema info at runtime
# This is a 'Senior Architect' move to ensure the LLM always has the ground truth.
try:
    schema = graph_service.get_schema()
    execute_graph_query.description = execute_graph_query.description.format(schema_info=schema)
except Exception:
    execute_graph_query.description = execute_graph_query.description.format(schema_info="Schema currently unavailable.")