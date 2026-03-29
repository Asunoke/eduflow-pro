import re

# Read new vars
new_vars = {'root': {}, 'dark': {}}
current_scope = None
with open('theme.css', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith(':root {'): current_scope = 'root'
        elif line.startswith('.dark {'): current_scope = 'dark'
        elif line.startswith('--') and ':' in line:
            k, v = line.split(':', 1)
            new_vars[current_scope][k.strip()] = v.replace(';', '').strip()

# Update index.css
with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_vars(match):
    scope_name = 'root' if ':root' in match.group(0) else 'dark'
    scope_content = match.group(2)
    # For every var in new_vars[scope_name], replace it or add it
    for k, v in new_vars[scope_name].items():
        if re.search(rf"([ \t]+){k}:\s*[^;]+;", scope_content):
            scope_content = re.sub(rf"([ \t]+){k}:\s*[^;]+;", rf"\g<1>{k}: {v};", scope_content)
        else:
            # Add it at the end
            # find last newline before the end
            scope_content = scope_content.rstrip() + f"\n    {k}: {v};\n  "
    return match.group(1) + scope_content + match.group(3)

content = re.sub(r'(:root\s*\{)(.*?)(\n\s*\})', replace_vars, content, flags=re.DOTALL)
content = re.sub(r'(\.dark\s*\{)(.*?)(\n\s*\})', replace_vars, content, flags=re.DOTALL)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
