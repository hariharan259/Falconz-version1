const KnowledgeRetriever = {
    search: async (query) => {
        if (!query || query.trim() === '') return [];
        try {
            const url = '/api/knowledge/search?q=' + encodeURIComponent(query);
            const response = await fetch(url);
            if (!response.ok) {
                console.error("Knowledge search failed:", response.statusText);
                return [];
            }
            const data = await response.json();
            return data.matches || [];
        } catch (error) {
            console.error("Knowledge retrieval error:", error);
            return [];
        }
    }
};

export default KnowledgeRetriever;
