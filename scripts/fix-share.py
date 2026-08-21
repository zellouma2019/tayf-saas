import re
f = '/home/z/my-project/src/components/customer/standalone-preview.tsx'
c = f.read()
old = 'const text = `
lines = old.split('
')
result = []
for line in lines:
    l = line.strip()
    if not l: continue
    l2 = ''
    try:
        l2 = l2.replace('${orderReference}', str(orderReference))
    except:
        pass
    try:
        l2 = l2.replace('${finalPricing.total.toFixed(2)}', str(finalPricing.total))
    except:
        pass
    try:
        l2 = l2.replace('${file?.name}', str(file?.name))
    except:
        pass
    result.append(l2)
new_text = '
'.join(result)
c = c[:ns] + new_text + c[ne:]
f.seek(0)
f.write(c)
print('Fixed')
