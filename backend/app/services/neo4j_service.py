import os
import logging
from typing import List, Dict, Any, Optional
from neo4j import GraphDatabase, Driver
from dotenv import load_dotenv

# AWS Friendly: Load env only if not in Lambda (Lambda provides these natively)
if not os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Neo4jService")

class Neo4jService:
    """
    Service Layer for Neo4j Aura. 
    Optimized for AWS Lambda 'Warm Starts' via Global Driver Instance.
    """
    # This class variable persists across Lambda invocations in the same container
    _driver: Optional[Driver] = None

    def __init__(self):
        """
        Initializes the driver in the Global scope.
        """
        if Neo4jService._driver is None:
            uri = os.getenv("NEO4J_URI")
            user = os.getenv("NEO4J_USERNAME", "neo4j")
            password = os.getenv("NEO4J_PASSWORD")
            
            if not uri or not password:
                logger.error("❌ Neo4j Credentials missing in Environment.")
                raise ValueError("NEO4J_URI and NEO4J_PASSWORD must be set.")

            try:
                # AWS Friendly: We set max_connection_lifetime to handle 
                # Aura's load balancers potentially dropping idle connections.
                Neo4jService._driver = GraphDatabase.driver(
                    uri, 
                    auth=(user, password),
                    max_connection_lifetime=60 * 5 # 5 minutes
                )
                # Verify in Init phase to 'Fail Fast'
                Neo4jService._driver.verify_connectivity()
                logger.info("✅ Neo4j Connection Verified (Global Init).")
            except Exception as e:
                logger.error(f"❌ Neo4j Connection Failed: {str(e)}")
                raise

    def get_schema(self) -> str:
        """
        Returns a string representation of labels and relationships.
        Used to ground the LLM in your specific Ingestion Pipeline structure.
        """
        query = """
        CALL db.labels() YIELD label 
        RETURN collect(label) as labels
        """
        with self._driver.session() as session:
            result = session.execute_read(lambda tx: tx.run(query).single())
            labels = result["labels"] if result else []
            return f"Nodes: {', '.join(labels)}"

    def run_read_query(self, cypher: str, params: Optional[Dict] = None) -> List[Dict]:
        """
        Executes a read-only transaction. 
        Enforces 'execute_read' for safety and optimization.
        """
        with self._driver.session() as session:
            try:
                return session.execute_read(lambda tx: tx.run(cypher, params or {}).data())
            except Exception as e:
                logger.error(f"Cypher Error: {str(e)}")
                return [{"error": str(e)}]

    def close(self):
        """Used for local cleanup; rarely called in Lambda."""
        if Neo4jService._driver:
            Neo4jService._driver.close()
            Neo4jService._driver = None

# AWS Friendly: Instantiate at the module level.
# This runs ONCE during the Lambda 'Init' phase and stays in memory for 'Warm' calls.
graph_service = Neo4jService()