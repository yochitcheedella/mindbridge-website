import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace Clinical -> Counselling, clinical -> counselling, CLINICAL -> COUNSELLING
    # But ONLY in places that look like natural language or UI text.
    # Exclude if preceded by / or . or { or } or [ or ] or ( or ) (often code)
    # Actually, replacing all occurrences that are preceded and followed by space or punctuation (like , . !) is a good heuristic.
    # Let's use a regex that matches \b(Clinical|clinical|CLINICAL)\b
    # and then we filter out lines that look like import statements or URLs.

    lines = content.split('\n')
    new_lines = []
    changed = False

    for line in lines:
        original_line = line
        
        # Skip import lines
        if line.strip().startswith('import ') or line.strip().startswith('export ') or line.strip().startswith('from '):
            new_lines.append(line)
            continue
            
        # Skip if it contains an API route or file path with clinical
        if '/clinical' in line.lower() or 'clinical/' in line.lower() or '.clinical' in line.lower() or 'clinical.' in line.lower():
            # If it's a URL or file path, keep it. But wait, what if the line has BOTH a URL and UI text?
            # Let's just do a simple replacement if it's not a URL line.
            pass
            
        # We'll use re.sub with a function to preserve case and check context
        def repl(match):
            word = match.group(0)
            
            # Check context: if it's part of a string like "/api/clinical", don't replace
            # We can do this by looking at the whole line.
            # But the repl function only sees the match.
            # Let's just replace if the word is "Clinical", "clinical", "CLINICAL".
            if word == 'Clinical': return 'Counselling'
            if word == 'clinical': return 'counselling'
            if word == 'CLINICAL': return 'COUNSELLING'
            return word

        # Only replace if not an import/export line
        # And we'll use a regex that doesn't match inside URLs by excluding matches preceded by / or .
        new_line = re.sub(r'(?<![/\.\-_])\b(Clinical|clinical|CLINICAL)\b(?![/\.\-_])', repl, line)
        
        # Revert replacements in dictionary keys or variables if they accidentally matched
        # e.g. clinical: true
        # Actually, \b already handles variables like clinicalNotes (doesn't match).
        
        if new_line != line:
            # Check if we accidentally replaced something in a code context like `counselling:`
            if re.search(r'counselling\s*:', new_line) or re.search(r'counselling\s*=', new_line):
                # Probably a dict key or variable assignment, let's keep original
                new_line = line
            else:
                changed = True
                
        new_lines.append(new_line)

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, file))
            
for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith('.py'):
            process_file(os.path.join(root, file))
