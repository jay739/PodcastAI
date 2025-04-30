import faiss
import numpy as np
import logging
from typing import List, Optional, Dict
from sentence_transformers import SentenceTransformer

class TextChunk:
    def __init__(self, chunk_id: int, text: str, metadata: Optional[Dict] = None):
        self.chunk_id = chunk_id
        self.text = text
        self.metadata = metadata or {}

class FaissVectorDB:
    def __init__(self, chunks: List[TextChunk]):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = chunks
        self.chunk_texts = [chunk.text for chunk in chunks]
        embeddings = self.model.encode(self.chunk_texts)
        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(np.array(embeddings).astype('float32'))

    def retrieve_relevant_chunks(self, query: str, top_k: int = 3) -> List[TextChunk]:
        query_embedding = self.model.encode([query]).astype('float32')
        distances, indices = self.index.search(query_embedding, top_k)
        results = []
        for i in indices[0]:
            if i < len(self.chunks):
                results.append(self.chunks[i])
        return results