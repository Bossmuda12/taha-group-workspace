import * as XLSX from "xlsx";

// Mengubah array of objects menjadi buffer .xlsx siap-unduh.
export function toXlsxBuffer(rows: Record<string, any>[], sheetName = "Sheet1"): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return out as Buffer;
}
