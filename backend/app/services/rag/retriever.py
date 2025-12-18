from typing import List, Dict, Any
from app.services.rag.vector_store import VectorStore
from app.core.logging import get_logger

logger = get_logger(__name__)


class Retriever:
    """Retriever for RAG pipeline."""
    
    def __init__(self):
        self.vector_store = VectorStore()
    
    async def retrieve_relevant_context(
        self,
        query: str,
        collection_name: str,
        n_results: int = 3
    ) -> str:
        """Retrieve relevant context for a query."""
        try:
            results = await self.vector_store.search(
                collection_name=collection_name,
                query=query,
                n_results=n_results
            )
            
            # Combine retrieved documents
            if results and results.get('documents'):
                documents = results['documents'][0]  # First query results
                context = "\n\n".join(documents)
                logger.info(f"Retrieved {len(documents)} relevant documents")
                return context
            
            return ""
            
        except Exception as e:
            logger.error(f"Retrieval error: {str(e)}")
            return ""
    
    async def retrieve_with_scores(
        self,
        query: str,
        collection_name: str,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve documents with relevance scores."""
        try:
            results = await self.vector_store.search(
                collection_name=collection_name,
                query=query,
                n_results=n_results
            )
            
            if not results or not results.get('documents'):
                return []
            
            documents = results['documents'][0]
            distances = results.get('distances', [[]])[0]
            metadatas = results.get('metadatas', [[]])[0]
            
            retrieved_docs = []
            for i, doc in enumerate(documents):
                retrieved_docs.append({
                    'content': doc,
                    'score': 1 - distances[i] if i < len(distances) else 0,  # Convert distance to similarity
                    'metadata': metadatas[i] if i < len(metadatas) else {}
                })
            
            return retrieved_docs
            
        except Exception as e:
            logger.error(f"Retrieval with scores error: {str(e)}")
            return []