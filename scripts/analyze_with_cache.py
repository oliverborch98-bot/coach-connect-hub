import hashlib
import json
import os
import argparse
import sys

CACHE_FILE = ".antigravity_data_cache.json"

def get_file_hash(file_path):
    if not os.path.exists(file_path):
        return None
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=4)

def main():
    parser = argparse.ArgumentParser(description="Antigravity Memory Manager - File Analysis Cache")
    parser.add_argument("--mode", choices=["analyze", "recall"], required=True, help="Mode: analyze (store) or recall (retrieve)")
    parser.add_argument("--file", required=True, help="Path to the file being analyzed")
    parser.add_argument("--content", help="The analysis result to store (required for analyze mode)")

    args = parser.parse_args()

    file_hash = get_file_hash(args.file)
    if not file_hash:
        print(f"Error: File '{args.file}' not found.")
        sys.exit(1)

    cache = load_cache()

    if args.mode == "recall":
        if file_hash in cache:
            print(cache[file_hash])
        else:
            print("CACHE_MISS: Analysis not found for this version of the file.")
            sys.exit(0)

    elif args.mode == "analyze":
        if not args.content:
            print("Error: --content is required for analyze mode.")
            sys.exit(1)
        
        cache[file_hash] = args.content
        save_cache(cache)
        print(f"Success: Analysis for '{args.file}' stored in cache.")

if __name__ == "__main__":
    main()
