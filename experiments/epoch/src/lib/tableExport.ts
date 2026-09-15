/**
 * tableExport.ts — shared CSV/.xlsx download mechanic for the UC4 viewer's
 * export buttons (F2, P4/P5/P6). One column definition drives both formats
 * so they never drift apart.
 *
 * `xlsx` (SheetJS) is loaded via dynamic import inside downloadXlsx, so it
 * never enters the main bundle — it only downloads when an export button is
 * actually clicked.
 */

export interface ExportColumn<T> {
  header: string;
  get: (row: T) => string;
  /** Character width — only consumed by the Excel export; CSV carries no
   *  column-width metadata, which is why a CSV opened in Excel shows long
   *  fields clipped even when the underlying value is complete. */
  wch: number;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function rowsToCsv<T>(columns: ExportColumn<T>[], rows: T[]): string {
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvCell(c.get(row))).join(","));
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ExportSheet<T> {
  name: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

/** A real .xlsx (not CSV-with-an-.xlsx-name) so column widths ship inside
 *  the file itself. Works for a single sheet (pass one-element `sheets`) or
 *  several (F2's export adds one sheet per persona). The first sheet in
 *  `sheets` is always the one shown on open — put whichever sheet should
 *  greet the reader first at index 0. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function downloadXlsx(filename: string, sheets: ExportSheet<any>[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const aoa = [
      sheet.columns.map((c) => c.header),
      ...sheet.rows.map((row) => sheet.columns.map((c) => c.get(row))),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!cols"] = sheet.columns.map((c) => ({ wch: c.wch }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  XLSX.writeFile(workbook, filename);
}
