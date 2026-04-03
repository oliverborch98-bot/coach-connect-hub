import json
import os
import argparse
import sys
import datetime
import uuid

VAULT_FILE = ".antigravity_knowledge_vault.json"

def load_vault():
    if os.path.exists(VAULT_FILE):
        try:
            with open(VAULT_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {"insights": []}
    return {"insights": []}

def save_vault(vault):
    with open(VAULT_FILE, "w") as f:
        json.dump(vault, f, indent=4)

def add_insight(content, tags):
    vault = load_vault()
    insight = {
        "id": str(uuid.uuid4())[:8],
        "content": content,
        "tags": [t.strip().lower() for t in tags.split(",")] if tags else [],
        "timestamp": datetime.datetime.now().isoformat()
    }
    vault["insights"].append(insight)
    save_vault(vault)
    return insight

def search_vault(query, tags=None):
    vault = load_vault()
    results = []
    
    search_tags = [t.strip().lower() for t in tags.split(",")] if tags else []
    
    for insight in vault["insights"]:
        match = False
        
        # Tag match
        if search_tags:
            if all(t in insight["tags"] for t in search_tags):
                match = True
        
        # Keyword match
        if query and query.lower() in insight["content"].lower():
            match = True
            
        if (not query and not search_tags) or match:
            results.append(insight)
            
    return results

def main():
    parser = argparse.ArgumentParser(description="Antigravity Knowledge Vault - Memory MCP")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Add command
    add_parser = subparsers.add_parser("add", help="Add a new insight")
    add_parser.add_argument("--content", required=True, help="Knowledge content")
    add_parser.add_argument("--tags", help="Comma-separated tags")
    
    # Search command
    search_parser = subparsers.add_parser("search", help="Search the vault")
    search_parser.add_argument("--query", help="Text search query")
    search_parser.add_argument("--tags", help="Filter by tags")
    
    # List command
    subparsers.add_parser("list", help="List all insights")
    
    args = parser.parse_args()
    
    if args.command == "add":
        insight = add_insight(args.content, args.tags)
        print(f"Success: Insight [{insight['id']}] added to vault.")
        
    elif args.command == "search" or args.command == "list":
        results = search_vault(getattr(args, "query", None), getattr(args, "tags", None))
        if not results:
            print("No matching insights found.")
        else:
            print(f"\n--- Knowledge Vault: {len(results)} matches ---")
            for r in results:
                tags_str = f" [{', '.join(r['tags'])}]" if r['tags'] else ""
                print(f"\nID: {r['id']}{tags_str}")
                print(f"Time: {r['timestamp']}")
                print(f"Content: {r['content']}")
            print("\n-------------------------------------------")

if __name__ == "__main__":
    main()
