import sys
import os
import argparse

def check_balanced_structures(content):
    pairs = {'{': '}', '[': ']', '(': ')'}
    stack = []
    
    for char in content:
        if char in pairs.keys():
            stack.append(char)
        elif char in pairs.values():
            if not stack:
                return False, "Unmatched closing structure found early."
            top = stack.pop()
            if pairs[top] != char:
                return False, f"Mismatched structure: found '{char}' expecting '{pairs[top]}'."
    
    if stack:
        return False, f"Incomplete structure: missing {len(stack)} closing elements."
    
    return True, "All basic structures (braces, brackets, parens) are balanced."

def repair_balance(content):
    pairs = {'{': '}', '[': ']', '(': ')'}
    stack = []
    
    for char in content:
        if char in pairs.keys():
            stack.append(char)
        elif char in pairs.values():
            if stack and pairs[stack[-1]] == char:
                stack.pop()
    
    # Append missing closing characters in reverse order
    fixed = content
    while stack:
        missing = pairs[stack.pop()]
        fixed += f"\n{missing}"
    
    return fixed

def main():
    parser = argparse.ArgumentParser(description="Code Structure Repair Tool")
    parser.add_argument("file", help="Path to the code file to repair")
    parser.add_argument("--inplace", action="store_true", help="Fix the file in place")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Error: File '{args.file}' not found.")
        sys.exit(1)
        
    with open(args.file, 'r') as f:
        content = f.read()
        
    is_balanced, message = check_balanced_structures(content)
    print(f"Status: {message}")
    
    if not is_balanced:
        if "Incomplete" in message:
            print("Attempting to auto-balance code structures...")
            fixed_content = repair_balance(content)
            if args.inplace:
                with open(args.file, 'w') as out:
                    out.write(fixed_content)
                print(f"File '{args.file}' repaired.")
            else:
                print("\n--- Repaired Code ---")
                print(fixed_content)
                print("----------------------")
        else:
            print("Structural mismatch detected. Partial repair not possible via basic balancing.")
            sys.exit(1)

if __name__ == "__main__":
    main()
