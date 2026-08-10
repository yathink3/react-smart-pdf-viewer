import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createPlugin } from '../helpers/createPlugin';

export const excelRenderer = createPlugin({
  name: 'excelRenderer',
  canHandle: ['.xlsx', '.xls'],
  render: async url => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const doc = new jsPDF('l', 'pt', 'a4');

    workbook.SheetNames.forEach((sheetName, index) => {
      if (index > 0) doc.addPage();
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: true,
        defval: '',
      });

      if (jsonData.length > 0) {
        // 1. DYNAMICALLY FIND DATA BOUNDS (Leftmost and Rightmost non-empty columns)
        let minCol = Infinity;
        let maxCol = -Infinity;

        jsonData.forEach(row => {
          row.forEach((cell, idx) => {
            if (cell !== null && cell !== undefined && cell.toString().trim() !== '') {
              if (idx < minCol) minCol = idx;
              if (idx > maxCol) maxCol = idx;
            }
          });
        });

        // If sheet is empty, skip
        if (minCol === Infinity) return;

        // 2. CLEAN DATA: Remove empty leading/trailing columns to stop "stretching"
        const cleanedData = jsonData.map(row => row.slice(minCol, maxCol + 1));
        const dataWidth = maxCol - minCol + 1;

        // 3. DYNAMIC HEADER DETECTION
        // Find the first row where every column in the range has a value
        const headerRowIndex = cleanedData.findIndex(row => {
          const filledCells = row.filter(cell => cell.toString().trim() !== '').length;
          return filledCells === dataWidth;
        });

        doc.setFontSize(14);
        doc.text(sheetName, 40, 30);

        autoTable(doc, {
          body: cleanedData, // Still using all data
          startY: 50,
          theme: 'grid',
          styles: {
            fontSize: 9,
            overflow: 'linebreak',
            cellPadding: 4,
          },
          // DYNAMIC STYLING
          didParseCell: data => {
            // If this is the row we identified as the full header
            if (data.row.index === headerRowIndex) {
              data.cell.styles.fillColor = [52, 73, 94];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.halign = 'center';
              data.cell.styles.lineWidth = 0.5;
            }
          },
          margin: { left: 40, right: 40 },
          tableWidth: 'auto',
          horizontalPageBreak: true, // Prevents horizontal stretching on tiny pages
        });
      }
    });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  },
});
