interface CsvRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function downloadCsv(filename: string, rows: CsvRow[]): void {
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r).filter(k => k !== 'id'))));
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
