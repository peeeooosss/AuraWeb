import * as XLSX from 'xlsx';

export async function extractXLSXData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });

        const sheets = {};
        workbook.SheetNames.forEach(name => {
          sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        });

        resolve({
          sheetNames: workbook.SheetNames,
          sheets,
          totalRows: Object.values(sheets).reduce((sum, sheet) => sum + sheet.length, 0),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function isXLSXFile(file) {
  return file.type.includes('spreadsheet') ||
    file.type.includes('excel') ||
    file.name?.endsWith('.xlsx') ||
    file.name?.endsWith('.xls');
}
