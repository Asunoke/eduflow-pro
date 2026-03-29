import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fallback for non-tauri environments
const downloadFileWeb = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Handles file saving, using Tauri dialog if available, otherwise browser download
 */
async function saveFile(content: Uint8Array | string, filename: string, extension: string) {
  try {
    // Check if we're in Tauri
    const isTauri = !!(window as any).__TAURI_INTERNALS__;
    
    if (isTauri) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      
      const filePath = await save({
        defaultPath: `${filename}.${extension}`,
        filters: [{
          name: extension.toUpperCase(),
          extensions: [extension]
        }]
      });

      if (filePath) {
        const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;
        await writeFile(filePath, data);
        
        // Dynamic import to avoid circular dep if toast is in a shared lib, 
        // but here we just use what we have.
        return true;
      }
      return false; // User cancelled
    } else {
      // Browser fallback
      const typeMap: Record<string, string> = {
        'xlsx': 'application/octet-stream',
        'pdf': 'application/pdf',
        'json': 'application/json'
      };
      
      // Fix for the BlobPart error
      const blobContent = typeof content === 'string' ? content : (content.buffer as ArrayBuffer);
      const blob = new Blob([blobContent], { type: typeMap[extension] || 'application/octet-stream' });
      downloadFileWeb(blob, `${filename}.${extension}`);
      return true;
    }
  } catch (error) {
    console.error('Export error:', error);
    // On peut tenter d'afficher l'erreur via toast si on l'importe, 
    // mais ici on va juste essayer d'être plus robuste.
    throw error;
  }
}

/**
 * Exports data to an Excel file
 */
export async function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const uint8Array = new Uint8Array(excelBuffer);
  
  return await saveFile(uint8Array, `${filename}_${new Date().toISOString().split('T')[0]}`, 'xlsx');
}

/**
 * Exports data to a PDF file
 */
export async function exportToPDF(data: any[], filename: string, title: string) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 30);
  
  // Extract headers and rows
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header]));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [138, 121, 171], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [241, 239, 245] },
    });
  } else {
    doc.text("Aucune donnée disponible", 14, 40);
  }
  
  const pdfOutput = doc.output('arraybuffer');
  return await saveFile(new Uint8Array(pdfOutput), `${filename}_${new Date().toISOString().split('T')[0]}`, 'pdf');
}

/**
 * Downloads a JSON file (for backups)
 */
export async function downloadJSON(data: any, filename: string) {
  return await saveFile(JSON.stringify(data, null, 2), filename, 'json');
}
