import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.rag.embeddings import EmbeddingService
from app.core.logging import get_logger
import uuid

logger = get_logger(__name__)


class VectorStore:
    """Vector store for RAG using ChromaDB."""
    
    def __init__(self):
        """Initialize vector store."""
        try:
            self.client = chromadb.PersistentClient(
                path=settings.VECTOR_DB_PATH,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self.embedding_service = EmbeddingService()
            logger.info("Vector store initialized")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            raise
    
    def get_or_create_collection(self, collection_name: str):
        """Get or create a collection."""
        try:
            collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"description": f"Collection for {collection_name}"}
            )
            return collection
        except Exception as e:
            logger.error(f"Collection error: {str(e)}")
            raise
    
    async def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ):
        """Add documents to collection."""
        try:
            collection = self.get_or_create_collection(collection_name)
            
            # Generate embeddings
            embeddings = self.embedding_service.generate_embeddings(documents)
            
            # Generate IDs if not provided
            if ids is None:
                ids = [str(uuid.uuid4()) for _ in documents]
            
            # Add to collection
            collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas or [{} for _ in documents],
                ids=ids
            )
            
            logger.info(f"Added {len(documents)} documents to {collection_name}")
            
        except Exception as e:
            logger.error(f"Add documents error: {str(e)}")
            raise
    
    async def search(
        self,
        collection_name: str,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for similar documents."""
        try:
            collection = self.get_or_create_collection(collection_name)
            
            # Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(query)
            
            # Search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where
            )
            
            logger.info(f"Search completed in {collection_name}")
            return results
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            raise
    
    async def delete_collection(self, collection_name: str):
        """Delete a collection."""
        try:
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
        except Exception as e:
            logger.error(f"Delete collection error: {str(e)}")
            raise
