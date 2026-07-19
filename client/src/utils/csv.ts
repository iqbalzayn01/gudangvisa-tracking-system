/**
 * Minimal CSV helpers (no dependency). Fields are quoted only when needed and
 * embedded quotes are doubled per RFC 4180. Rows are joined with CRLF so the
 * output opens cleanly in Excel and Google Sheets.
 */

type CsvValue = string | number;

function escapeField(value: CsvValue): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from a header row and body rows. */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeField).join(','),
  );
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of `csv` as `filename`. A UTF-8 BOM is prepended
 * so spreadsheet apps detect the encoding and render accented characters.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
