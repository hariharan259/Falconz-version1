import re
from knowledge.knowledge_loader import load_knowledge_base

class KnowledgeRetriever:
    def __init__(self):
        self.documents = load_knowledge_base()
        
    def normalize_query(self, query):
        """Lowercase and remove punctuation."""
        return re.sub(r'[^\w\s]', '', query.lower())

    def search(self, query, top_k=3):
        """
        Simple keyword-based ranking:
        - Exact phrase match (10 points)
        - Title match (5 points)
        - Category match (3 points)
        - Keyword match in content (1 point per word match)
        """
        if not query:
            return []
            
        norm_query = self.normalize_query(query)
        keywords = norm_query.split()
        
        results = []
        for doc in self.documents:
            score = 0
            norm_content = self.normalize_query(doc['content'])
            norm_title = self.normalize_query(doc['title'])
            norm_category = self.normalize_query(doc['category'])
            
            # 1. Exact phrase match in content
            if norm_query in norm_content:
                score += 10
                
            # 2. Title match
            for kw in keywords:
                if kw in norm_title:
                    score += 5
                    
            # 3. Category match
            for kw in keywords:
                if kw == norm_category:
                    score += 3
                    
            # 4. Keyword match in content
            for kw in keywords:
                if len(kw) > 2 and kw in norm_content:
                    score += 1
                    
            if score > 0:
                results.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "source": doc["source"],
                    "content": doc["content"],
                    "relevance": score
                })
                
        # Sort by relevance descending
        results.sort(key=lambda x: x['relevance'], reverse=True)
        return results[:top_k]

# Global instance to cache knowledge base in memory
retriever = KnowledgeRetriever()

def search_knowledge(query):
    return retriever.search(query)
