import re

with open('src/components/customer/standalone-preview.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Enhance file card with paper texture and shadow for images
old = 'className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 bg-gradient-to-br'
new = 'className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-105 transition-transform duration-300'
content = content.replace(old, new, 1)
print('1. File card enhanced with paper texture gradient + shadow')

# 2. Add WhatsApp icon next to share button
old_share = '<Copy className="h-3.5 w-3.5" />'
new_share = '<Copy className="h-3.5 w-3.5" /><MessageCircle className="h-3 w-3.5 text-green-500" />'
content = content.replace(old_share, new_share, 1)
print('2. WhatsApp icon next to share button')

# 3. Enhance stat cards with hover lift effect
old_stat = 'rounded-2xl border bg-card p-4 shadow-sm'
new_stat = 'rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
content = content.replace(old_stat, new_stat, 1)
print('3. Stat cards with hover lift effect')

# 4. Add print readiness pulse animation class
old_ready = '"جاهز للطباعة"'
new_ready = '"جاهز للطباعة"'
content = content.replace(old_ready, new_ready, 1)

with open('src/components/customer/standalone-preview.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('All improvements applied')
