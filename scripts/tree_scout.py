import os
import argparse
import sys

def list_directory(path):
    if not os.path.exists(path):
        print(f"Error: Path '{path}' does not exist.")
        sys.exit(1)
    
    if not os.path.isdir(path):
        print(f"Error: Path '{path}' is not a directory.")
        sys.exit(1)

    try:
        items = os.listdir(path)
        items.sort()
        
        folders = [f for f in items if os.path.isdir(os.path.join(path, f)) and not f.startswith('.')]
        files = [f for f in items if os.path.isfile(os.path.join(path, f)) and not f.startswith('.')]

        print(f"\n--- Exploring: {os.path.abspath(path)} ---")
        
        if folders:
            print("\n[FOLDERS]")
            for folder in folders:
                print(f"  📁 {folder}/")
        
        if files:
            print("\n[FILES]")
            for file in files:
                size = os.path.getsize(os.path.join(path, file))
                print(f"  📄 {file} ({size} bytes)")
        
        if not folders and not files:
            print("\n(Empty directory)")
            
        print("\n--- End of Level ---")
        
    except PermissionError:
        print(f"Error: Permission denied for '{path}'.")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Antigravity Project Scout - Progressive Disclosure Tool")
    parser.add_argument("path", nargs="?", default=".", help="Directory path to explore (default: current directory)")
    
    args = parser.parse_args()
    list_directory(args.path)

if __name__ == "__main__":
    main()
