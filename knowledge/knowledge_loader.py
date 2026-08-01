import os
import re

KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__))

def parse_frontmatter(content):
    """
    Parses simple YAML-like frontmatter from markdown files.
    Format:
    ---
    key: value
    ---
    """
    metadata = {}
    body = content
    match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if match:
        frontmatter, body = match.groups()
        for line in frontmatter.split('\n'):
            line = line.strip()
            if line and ':' in line:
                key, val = line.split(':', 1)
                metadata[key.strip()] = val.strip()
    return metadata, body.strip()

def load_knowledge_base():
    """
    Recursively scans the knowledge directory and loads all .md files.
    Returns a list of document dictionaries.
    """
    documents = []
    
    for root, dirs, files in os.walk(KNOWLEDGE_DIR):
        for file in files:
            if file.endswith('.md') and file != 'README.md':
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    metadata, body = parse_frontmatter(content)
                    
                    doc = {
                        "id": metadata.get("id", file),
                        "title": metadata.get("title", file.replace('.md', '')),
                        "category": metadata.get("category", "GENERAL"),
                        "source": metadata.get("source", "FalconZ Knowledge Base"),
                        "content": body,
                        "filepath": filepath
                    }
                    documents.append(doc)
                except Exception as e:
                    print(f"Error loading {filepath}: {e}")
                    
    return documents

if __name__ == "__main__":
    docs = load_knowledge_base()
    print(f"Loaded {len(docs)} documents.")
