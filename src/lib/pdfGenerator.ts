import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Payment, Student, Class, SchoolSettings, Invoice, Receipt } from '@/types';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Format currency amounts specifically for jsPDF standard fonts.
 * Uses standard ASCII space (char code 32) instead of non-breaking space (\u202F or \u00A0)
 * to prevent jsPDF from rendering slashes '/' in place of spaces.
 */
export function formatPDFMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 FCFA';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

// Convert numbers to French words (simplified for West African CFA currency)
export function numberToWordsFR(num: number): string {
  if (num <= 0) return 'Zéro Franc CFA';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (ten === 7 || ten === 9) {
        return tens[ten - 1] + '-' + teens[unit];
      }
      return tens[ten] + (unit > 0 ? '-' + units[unit] : '');
    }
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    const hundredStr = hundred === 1 ? 'cent' : units[hundred] + ' cents';
    return rest > 0 ? hundredStr + ' ' + convertGroup(rest) : hundredStr;
  }

  let result = '';
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result += (millions === 1 ? 'un million' : convertGroup(millions) + ' millions') + ' ';
    num %= 1000000;
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += (thousands === 1 ? 'mille' : convertGroup(thousands) + ' mille') + ' ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertGroup(num);
  }

  return result.trim().toUpperCase() + ' FRANCS CFA';
}

/**
 * Output helper to reliably trigger download (with native Save file dialog under Tauri) or print view.
 */
async function outputPDF(doc: jsPDF, filename: string, mode: 'download' | 'print' = 'download'): Promise<boolean> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_');
  const finalName = safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;

  if (isTauriEnvironment() && mode === 'download') {
    try {
      const filePath = await save({
        defaultPath: finalName,
        filters: [{ name: 'Document PDF', extensions: ['pdf'] }],
      });

      if (filePath) {
        const arrayBuffer = doc.output('arraybuffer');
        const uint8 = new Uint8Array(arrayBuffer);
        await writeFile(filePath, uint8);
        return true;
      }
      return false; // User cancelled dialog
    } catch (err) {
      console.warn('Erreur lors du dialogue de sauvegarde native Tauri, fallback navigateur:', err);
    }
  }

  // Fallback Browser mode / Print mode
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  if (mode === 'print') {
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
    }
  } else {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 30000);
  return true;
}

export async function generatePaymentReceiptPDF(
  payment: Payment,
  student: Student,
  studentClass?: Class,
  settings?: SchoolSettings | null,
  receiptNumber?: string,
  mode: 'download' | 'print' = 'download'
): Promise<boolean> {
  const doc = new jsPDF();
  const schoolName = settings?.schoolName || 'ÉTABLISSEMENT EDUFLOW PRO';
  const schoolAddress = settings?.address || 'Bamako, République du Mali';
  const schoolPhone = settings?.phone || '+223 20 00 00 00';
  const schoolEmail = settings?.email || 'contact@eduflow.ml';
  const recNo = receiptNumber || `REC-${new Date().getFullYear()}-${payment.id.slice(-4).toUpperCase()}`;

  // Colors
  const primaryColor = [30, 58, 138]; // Deep Navy Blue
  const grayColor = [100, 116, 139];

  // Header - Institution Info (Left) & Mali Header (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(schoolName.toUpperCase(), 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(schoolAddress, 14, 26);
  doc.text(`Tél: ${schoolPhone} | Email: ${schoolEmail}`, 14, 31);
  if (settings?.nif) doc.text(`NIF: ${settings.nif} | STAT: ${settings.stat || '-'}`, 14, 36);

  // Republic of Mali Seal text (Right header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('RÉPUBLIQUE DU MALI', 195, 20, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Un Peuple - Un But - Une Foi', 195, 24, { align: 'right' });
  doc.text('Ministère de l\'Éducation Nationale', 195, 28, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 42, 196, 42);

  // Receipt Title Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, 48, 182, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`REÇU DE PAIEMENT N° ${recNo}`, 105, 56, { align: 'center' });

  // Metadata Box (Date & Academic Year)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Date d'émission: ${payment.date}`, 14, 68);
  doc.text(`Année Scolaire: ${payment.academicYear}`, 196, 68, { align: 'right' });

  // Student Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 73, 182, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 73, 182, 32, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INFORMATIONS DE L\'ÉLÈVE :', 18, 80);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Nom & Prénom : ${student.lastName.toUpperCase()} ${student.firstName}`, 18, 87);
  doc.text(`Matricule : ${student.matricule}`, 18, 93);
  doc.text(`Classe : ${studentClass?.name || 'Non spécifiée'}`, 18, 99);

  doc.text(`Parent / Tuteur : ${student.parentName || '-'}`, 110, 87);
  doc.text(`Téléphone : ${student.parentPhone || '-'}`, 110, 93);

  // Table of Payment Items
  const tableData = [
    [
      payment.description || 'Paiement des Frais de Scolarité',
      payment.method.toUpperCase().replace('_', ' '),
      payment.reference || '-',
      formatPDFMoney(payment.amount)
    ]
  ];

  autoTable(doc, {
    startY: 112,
    head: [['Désignation', 'Mode de Règlement', 'Référence', 'Montant Payé']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Amount in Words Box
  const amountWords = numberToWordsFR(payment.amount);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY, 182, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Arrêté le présent reçu à la somme de :', 18, finalY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(amountWords, 18, finalY + 10);

  // Signatures Area
  const sigY = finalY + 25;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Signature du Bénéficiaire / Parent', 30, sigY);
  doc.text('Cachet & Signature de l\'Établissement', 130, sigY);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(130, sigY + 5, 55, 25, 'D');

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Ce reçu est délivré à titre d\'attestation de paiement. Conservez-le soigneusement.', 105, 285, { align: 'center' });

  // Execute download or print output
  return await outputPDF(doc, `Recu_${recNo}_${student.lastName}.pdf`, mode);
}

export async function generateInvoicePDF(
  invoice: Invoice,
  student: Student,
  studentClass?: Class,
  settings?: SchoolSettings | null,
  mode: 'download' | 'print' = 'download'
): Promise<boolean> {
  const doc = new jsPDF();
  const schoolName = settings?.schoolName || 'ÉTABLISSEMENT EDUFLOW PRO';
  const schoolAddress = settings?.address || 'Bamako, République du Mali';
  const schoolPhone = settings?.phone || '+223 20 00 00 00';
  const schoolEmail = settings?.email || 'contact@eduflow.ml';

  const primaryColor = [15, 23, 42]; // Slate 900

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(schoolName.toUpperCase(), 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(schoolAddress, 14, 26);
  doc.text(`Tél: ${schoolPhone} | Email: ${schoolEmail}`, 14, 31);
  if (settings?.nif) doc.text(`NIF: ${settings.nif} | STAT: ${settings.stat || '-'}`, 14, 36);

  // Invoice Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`FACTURE N° ${invoice.number}`, 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date d'émission: ${invoice.issueDate}`, 196, 27, { align: 'right' });
  doc.text(`Date d'échéance: ${invoice.dueDate}`, 196, 32, { align: 'right' });
  doc.text(`Statut: ${invoice.status.toUpperCase()}`, 196, 37, { align: 'right' });

  doc.line(14, 42, 196, 42);

  // Bill To Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, 182, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 48, 182, 30, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FACTURÉ À :', 18, 55);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Élève : ${student.lastName.toUpperCase()} ${student.firstName} (${student.matricule})`, 18, 62);
  doc.text(`Classe : ${studentClass?.name || '-'} | Tuteur : ${student.parentName}`, 18, 68);

  // Table Items
  const tableData = invoice.items.map((item) => [
    item.description,
    formatPDFMoney(item.amount)
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Description des Frais', 'Montant']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Total Summary Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL À PAYER : ${formatPDFMoney(invoice.totalAmount)}`, 196, finalY, { align: 'right' });

  // Execute download or print output
  return await outputPDF(doc, `Facture_${invoice.number}_${student.lastName}.pdf`, mode);
}
