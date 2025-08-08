export function downloadCsv(filename: string, rows: any[]) {
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r).filter(k=>k!=='id'))));
  const csv = [headers.join(',')].concat(rows.map(r=> headers.map(h=> JSON.stringify((r as any)[h]??'')).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}