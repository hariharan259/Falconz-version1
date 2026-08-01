const KnowledgeContext = {
    build: (documents) => {
        if (!documents || documents.length === 0) {
            return null;
        }

        let context = "[ FALCONZ KNOWLEDGE CONTEXT ]\n\n";
        
        documents.forEach(doc => {
            context += `Source:\n${doc.title}\n\n`;
            context += `Category:\n${doc.category}\n\n`;
            context += `Relevant Knowledge:\n${doc.content}\n\n`;
            context += `---\n\n`;
        });

        return context.trim();
    }
};

export default KnowledgeContext;
