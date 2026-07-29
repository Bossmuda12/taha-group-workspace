import * as XLSX from "xlsx";

// Mengubah array of objects menjadi Uint8Array .xlsx siap-unduh (kompatibel dengan BodyInit Response).
export function toXlsxBuffer(rows: Record<string, any>[], sheetName = "Sheet1"): Uint8Array {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out: ArrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(out);
}
