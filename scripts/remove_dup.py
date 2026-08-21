import sys
with open('src/components/customer/book-mockup-3d.tsx','r') as f:
    lines = f.readlines()
start = None
for i, line in enumerate(lines):
    if 'Procedural cover for flat sheet/image' in line and start is not None:
        depth = 0
        end = None
        for j in range(i, min(i+80, len(lines))):
            if '{' in lines[j] and '}' not in lines[j]:
                depth += lines[j].count('{') - lines[j].count('}')
            elif '}' in lines[j]:
                depth -= 1
                if depth <= 0:
                    end = j + 1
                    while end < len(lines) and lines[end].strip() == '':
                        end += 1
                    rm = i
                    while rm > 0 and lines[rm-1].strip() == '':
                        rm -= 1
                    new_lines = lines[:rm] + lines[end:]
                    with open('src/components/customer/book-mockup-3d.tsx','w') as f:
                        f.writelines(new_lines)
                    print(f'Removed lines {rm+1}-{end+1}')
                    sys.exit(0)
    if 'Procedural cover for flat sheet/image' in line:
        start = i
print('No second occurrence found')
