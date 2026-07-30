import re

# Read the main file
with open('/home/z/my-project/src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Read template files
with open('/home/z/my-project/scripts/r78-search-dialog.txt', 'r', encoding='utf-8') as f:
    search_dialog_code = f.read()

with open('/home/z/my-project/scripts/r78-donut-chart.txt', 'r', encoding='utf-8') as f:
    donut_chart_code = f.read()

with open('/home/z/my-project/scripts/r78-perf-metrics.txt', 'r', encoding='utf-8') as f:
    perf_metrics_code = f.read()

# 1. Add PieChart to imports (after Crown)
content = content.replace(
    'Crown,\n}',
    'Crown, PieChart,\n}'
)

# 2. Add searchDialog state after soundEnabled state block
old_sound = 'const [soundEnabled, setSoundEnabled] = useState(() => {'
sound_idx = content.find(old_sound)
if sound_idx < 0:
    print('ERROR: Could not find soundEnabled state')
    exit(1)

# Find the end of the soundEnabled block (next });
end_idx = content.find('});', sound_idx)
end_idx = content.find('\n', end_idx) + 1

insert_state = '''  // Advanced Search Dialog (R78)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
'''
content = content[:end_idx] + insert_state + content[end_idx:]

# 3. Modify Ctrl+K handler to open search dialog
old_ctrlk = 'e.preventDefault();\n        searchInputRef.current?.focus();\n        setSearchOpen(true);'
new_ctrlk = 'e.preventDefault();\n        setSearchDialogOpen(true);'
content = content.replace(old_ctrlk, new_ctrlk)

# 4. Insert search dialog, donut chart, and performance metrics components before Duplicate Order Warning
marker = '// ===== Duplicate Order Warning ====='
new_components = (
    search_dialog_code.rstrip() + '\n\n\n\n' +
    donut_chart_code.rstrip() + '\n\n\n\n' +
    perf_metrics_code.rstrip() + '\n\n\n\n' +
    marker
)
content = content.replace(marker, new_components)

# 5. Add donut chart + perf metrics in overview tab before Print Queue Manager
old_pq = '{/* Print Queue Manager */}\n            <PrintQueueManager'
new_pq = '''{/* Revenue Donut Chart (R78) */}
            <RevenueDonutChart orders={safeOrders} />

            {/* Performance Metrics Cards (R78) */}
            <PerformanceMetricsCards orders={safeOrders} />

            {/* Print Queue Manager */}
            <PrintQueueManager'''
content = content.replace(old_pq, new_pq)

# 6. Add bulk selection toolbar before Status Distribution Bar
old_sdb = '{/* Status Distribution Bar */}'
bulk_toolbar = '''{/* Bulk Selection Toolbar (R78) */}
            {selectedIds.size > 0 && (
              <div className="bulk-select-toolbar">
                <div className="bulk-select-info">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{selectedIds.size} طلب محدد</span>
                </div>
                <div className="bulk-select-actions">
                  <button onClick={() => {
                    const newSet = new Set(filteredOrders.map(o => o.id));
                    setSelectedIds(prev => prev.size === newSet.size ? new Set() : newSet);
                  }} className="bulk-select-btn bulk-select-btn-secondary">
                    {selectedIds.size === filteredOrders.length ? 'إلغاء الكل' : 'تحديد الكل'}
                  </button>
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="bulk-select-status-trigger"><SelectValue placeholder="تغيير الحالة" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_META).filter(([k]) => k !== 'cancelled').map(([key, meta]) => (
                        <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bulkStatus && (
                    <button onClick={() => { handleBulkStatusChange(); setSelectedIds(new Set()); }} className="bulk-select-btn bulk-select-btn-primary">
                      <Check className="h-3.5 w-3.5" /> تطبيق
                    </button>
                  )}
                  <button onClick={() => setSelectedIds(new Set())} className="bulk-select-btn bulk-select-btn-danger">
                    <X className="h-3.5 w-3.5" /> إلغاء التحديد
                  </button>
                </div>
              </div>
            )}

            {/* Status Distribution Bar */}'''
content = content.replace(old_sdb, bulk_toolbar)

# 7. Add checkbox to table header row
old_th = '''<TableHead className="text-right">الزبون</TableHead>'''
new_th = '''<TableHead className="w-8"><input type="checkbox" checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length} onChange={e => {
                      if (e.target.checked) { setSelectedIds(new Set(filteredOrders.map(o => o.id))); }
                      else { setSelectedIds(new Set()); }
                    }} className="bulk-row-checkbox" /></TableHead>
                    <TableHead className="text-right">الزبون</TableHead>'''
content = content.replace(old_th, new_th, 1)

# 8. Add checkbox cell to each order row in table view
# Find the pattern for order table rows
old_row_class = 'className={cn("cursor-pointer hover:bg-muted/50 transition-colors", selectedIds.has(o.id) && "bg-primary/5 row-selected")}'
row_idx = content.find(old_row_class)
if row_idx >= 0:
    # Find the > after this className
    gt_idx = content.find('>', row_idx)
    # Find the first <TableCell after it
    first_td = content.find('<TableCell', gt_idx)
    if first_td >= 0:
        checkbox_cell = '''<TableCell className="w-8" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(o.id)} onChange={e => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; }); }} className="bulk-row-checkbox" /></TableCell>\n                        <TableCell'''
        content = content[:first_td] + checkbox_cell + content[first_td + len('<TableCell'):]  

# 9. Update BUILD_HASH
content = content.replace(
    'const BUILD_HASH = "v7.4-"',
    'const BUILD_HASH = "v7.5-"'
)

# 10. Add Search Dialog render before FAB
old_fab = '{/* FAB */}'
search_render = '''{/* Advanced Search Dialog (R78) */}
            {searchDialogOpen && (
              <AdvancedSearchDialog
                orders={allOrders}
                onSelect={(o) => { setSelectedOrder(o); setQuickViewOrder(o); }}
                onClose={() => setSearchDialogOpen(false)}
                onSelectTab={(t) => setActiveTab(t as any)}
              />
            )}

            {/* FAB */}'''
content = content.replace(old_fab, search_render)

# Write the modified file
with open('/home/z/my-project/src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('R78 features added successfully!')
print('Components: AdvancedSearchDialog, RevenueDonutChart, PerformanceMetricsCards')
print('Features: Bulk selection toolbar, table checkboxes, search dialog (Ctrl+K)')
