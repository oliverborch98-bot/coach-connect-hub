import json
import re
import sys
import argparse

def fix_json(json_str):
    # Remove trailing commas in objects/arrays
    json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
    
    # Try to fix unquoted keys (simple case)
    json_str = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
    
    # Try to balance braces/brackets if missing at the end
    open_braces = json_str.count('{')
    close_braces = json_str.count('}')
    if open_braces > close_braces:
        json_str += '}' * (open_braces - close_braces)
        
    open_brackets = json_str.count('[')
    close_brackets = json_str.count(']')
    if open_brackets > close_brackets:
        json_str += ']' * (open_brackets - close_brackets)
        
    return json_str

def main():
    parser = argparse.ArgumentParser(description="JSON Validator and Fixer")
    parser.add_argument("file", help="Path to the JSON file to validate/fix")
    parser.add_argument("--inplace", action="store_true", help="Fix the file in place")
    
    args = parser.parse_args()
    
    try:
        with open(args.file, 'r') as f:
            content = f.read()
            
        try:
            json.loads(content)
            print(f"JSON in '{args.file}' is valid.")
        except json.JSONDecodeError as e:
            print(f"JSON Error: {e}")
            fixed_content = fix_json(content)
            
            try:
                json.loads(fixed_content)
                print("Heuristic repair successful!")
                if args.inplace:
                    with open(args.file, 'w') as out:
                        out.write(fixed_content)
                    print(f"File '{args.file}' updated.")
                else:
                    print("\n--- Fixed Content ---")
                    print(fixed_content)
                    print("----------------------")
            except json.JSONDecodeError:
                print("Heuristic repair failed to produce valid JSON.")
                sys.exit(1)
                
    except FileNotFoundError:
        print(f"Error: File '{args.file}' not found.")
        sys.exit(1)

if __name__ == "__main__":
    main()
