import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

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
export async function saveFile(content: Uint8Array | string, filename: string, extension: string) {
  try {
    // Robust detection for Tauri v2 environment
    const isTauri = !!(window as any).__TAURI_INTERNALS__ || 
                    !!(window as any).__TAURI__ || 
                    (typeof window !== 'undefined' && window.navigator.userAgent.includes('Tauri'));
    
    if (isTauri) {
      console.log(`[Tauri] Protocol: Starting export for ${filename}.${extension}`);
      
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
        console.log(`[Tauri] Destination selected: ${filePath}`);
        
        // Ensure data is Uint8Array for binary files (PDF/XLSX)
        let data: Uint8Array;
        if (typeof content === 'string') {
          data = new TextEncoder().encode(content);
        } else {
          data = content;
        }
        
        // Explicitly use writeFile to the absolute path
        await writeFile(filePath, data);
        
        console.log(`[Tauri] Write confirmed to: ${filePath}`);
        toast.success(`Fichier enregistré avec succès !`, {
          description: `Emplacement : ${filePath}`,
          duration: 5000
        });
        return true;
      }
      console.log(`[Tauri] Action cancelled by user`);
      return false; 
    } else {
      console.log(`[Web] Browser detected, using standard download`);
      const typeMap: Record<string, string> = {
        'xlsx': 'application/octet-stream',
        'pdf': 'application/pdf',
        'json': 'application/json'
      };
      
      const blobPart = (typeof content === 'string' ? content : content.buffer) as any;
      const blob = new Blob([blobPart], { type: typeMap[extension] || 'application/octet-stream' });
      downloadFileWeb(blob, `${filename}.${extension}`);
      toast.success("Téléchargement lancé dans le navigateur");
      return true;
    }
  } catch (error: any) {
    console.error('FATAL SYSTEM ERROR:', error);
    
    // Detailed error reporting for the user
    let errorMsg = "Erreur système inconnue";
    if (error?.message) errorMsg = error.message;
    else if (typeof error === 'string') errorMsg = error;
    
    toast.error(`Échec technique de l'enregistrement`, {
      description: `Détail: ${errorMsg}. Vérifiez vos dossiers de sécurité Windows.`,
      duration: 10000
    });
    
    return false;
  }
}

/**
 * Common layout for Bulletin drawing on a jsPDF instance
 */
function drawBulletinPage(doc: jsPDF, bulletin: any, settings: any) {
  const primaryColor = [138, 121, 171]; // #8A79AB
  
  // Header Info
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName.toUpperCase(), 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.address, 14, 26);
  doc.text(`Tél: ${settings.phone}`, 14, 31);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);
  
  // Period and Year
  doc.setFontSize(14);
  doc.setTextColor(60);
  doc.text(bulletin.period.name, 196, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Année: ${settings.currentAcademicYear}`, 196, 26, { align: 'right' });
  
  // Student Box
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(14, 45, 182, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('ÉLÈVE', 20, 52);
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bulletin.student.lastName} ${bulletin.student.firstName}`.toUpperCase(), 20, 60);
  
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('DATE NAISSANCE', 20, 68);
  doc.setTextColor(80);
  doc.text(bulletin.student.dateOfBirth || '-', 20, 73);
  
  doc.setTextColor(150);
  doc.text('MATRICULE', 70, 68);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(bulletin.student.matricule, 70, 73);
  
  doc.setTextColor(150);
  doc.text('CLASSE / EFFECTIF', 120, 68);
  doc.setTextColor(80);
  doc.text(`${bulletin.class.name} (${bulletin.totalStudents})`, 120, 73);

  doc.setTextColor(150);
  doc.text('SEXE', 170, 68);
  doc.setTextColor(80);
  doc.text(bulletin.student.gender === 'M' ? 'M' : 'F', 170, 73);

  // Grades Table
  const tableData = bulletin.grades.map((g: any) => [
    g.subject.name,
    g.subject.coefficient,
    g.homeworkAverage.toFixed(settings.gradingConfig.roundDecimals),
    g.examAverage.toFixed(settings.gradingConfig.roundDecimals),
    g.average.toFixed(settings.gradingConfig.roundDecimals),
    g.rank || '-',
    g.average >= 16 ? 'Excellent' : g.average >= 14 ? 'Très Bien' : g.average >= 12 ? 'Bien' : g.average >= 10 ? 'Passable' : 'Insuffisant'
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Matières', 'Coef', 'Dev.', 'Comp.', 'Moy.', 'Rang', 'Appréciation']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center' },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Summary Metrics
  doc.setFillColor(30, 30, 40);
  doc.roundedRect(14, finalY, 182, 25, 4, 4, 'F');
  
  doc.setTextColor(200);
  doc.setFontSize(9);
  doc.text('MOYENNE GÉNÉRALE', 25, finalY + 8);
  doc.setFontSize(22);
  doc.setTextColor(255);
  doc.text(bulletin.overallAverage.toFixed(settings.gradingConfig.roundDecimals), 25, finalY + 19);
  
  doc.setTextColor(200);
  doc.setFontSize(9);
  doc.text('RANG', 100, finalY + 8);
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${bulletin.classRank}${bulletin.classRank === 1 ? 'er' : 'ème'}`, 100, finalY + 18);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`sur ${bulletin.totalStudents}`, 100, finalY + 23);
  
  doc.setTextColor(200);
  doc.setFontSize(9);
  doc.text('DÉCISION', 155, finalY + 8);
  doc.setFontSize(14);
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  const decision = bulletin.decision === 'admis' ? 'ADMIS' : bulletin.decision === 'redouble' ? 'REDOUBLE' : bulletin.overallAverage >= 10 ? 'PASSABLE' : 'ÉCHEC';
  doc.text(decision, 155, finalY + 18);

  // Signatures
  const sigY = finalY + 45;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Le Tuteur', 40, sigY);
  doc.text('Le Directeur', 160, sigY, { align: 'right' });
  
  doc.setDrawColor(230);
  doc.line(30, sigY + 15, 70, sigY + 15);
  doc.line(140, sigY + 15, 180, sigY + 15);
}

/**
 * Exports all class bulletins in one PDF, sorted by rank
 */
export async function exportAllBulletinsToPDF(bulletins: any[], settings: any, filename: string) {
  const doc = new jsPDF();
  
  // Sort by average descending to ensure order reflects performance
  const sortedBulletins = [...bulletins].sort((a, b) => b.overallAverage - a.overallAverage);
  
  sortedBulletins.forEach((bulletin, index) => {
    if (index > 0) doc.addPage();
    drawBulletinPage(doc, bulletin, settings);
  });
  
  const pdfOutput = doc.output('arraybuffer');
  return await saveFile(new Uint8Array(pdfOutput), filename, 'pdf');
}

/**
 * Exports a single bulletin to PDF with premium layout
 */
export async function exportSingleBulletinToPDF(bulletin: any, settings: any, filename: string) {
  const doc = new jsPDF();
  drawBulletinPage(doc, bulletin, settings);
  const pdfOutput = doc.output('arraybuffer');
  return await saveFile(new Uint8Array(pdfOutput), filename, 'pdf');
}

/**
 * Exports data to a PDF file (Generic table version)
 */
export async function exportToPDF(data: any[], filename: string, title: string) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 30);
  
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
  }
  
  const pdfOutput = doc.output('arraybuffer');
  return await saveFile(new Uint8Array(pdfOutput), filename, 'pdf');
}

/**
 * Formatteur monétaire sécurisé pour jsPDF (remplace espaces insécables par espaces simples)
 */
const formatMoney = (amount: number) => {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/**
 * Generates a Malian standard payslip for a teacher
 */
export async function exportTeacherPayslip(teacher: any, schoolSettings: any, primes: { label: string, amount: number }[] = []) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const primaryColor = [138, 121, 171];
  
  // Header section
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSettings.schoolName.toUpperCase(), 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolSettings.address, 105, 26, { align: 'center' });
  
  // Fiscal info row
  const fiscalInfo = [
    schoolSettings.phone ? `Tél: ${schoolSettings.phone}` : '',
    schoolSettings.nif ? `NIF: ${schoolSettings.nif}` : 'NIF: -',
    schoolSettings.stat ? `STAT: ${schoolSettings.stat}` : 'STAT: -'
  ].filter(Boolean).join(' | ');
  
  doc.text(fiscalInfo, 105, 32, { align: 'center' });
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('BULLETIN DE PAIE', 105, 50, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Période de paie : ${dateStr.toUpperCase()}`, 105, 57, { align: 'center' });
  
  // Employee Info Block
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(20, 65, 170, 30, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('INFORMATIONS EMPLOYÉ', 25, 71);
  
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text(`${teacher.lastName} ${teacher.firstName}`.toUpperCase(), 25, 79);
  doc.setFont('helvetica', 'normal');
  doc.text(`Service/Matière : ${teacher.specialization || 'Enseignant'}`, 25, 86);
  
  doc.setFontSize(10);
  doc.text(`Matricule : ${teacher.id.split('-')[0].toUpperCase()}`, 130, 79);
  doc.text(`Date embauche : ${teacher.hireDate || '-'}`, 130, 86);
  
  // Payroll Calculations
  const baseSalary = teacher.salary || 0;
  const totalPrimes = primes.reduce((sum, p) => sum + p.amount, 0);
  const brutSalary = baseSalary + totalPrimes;
  
  // Mali Standard Deductions
  const inps = Math.round(brutSalary * 0.036); 
  const amo = Math.round(brutSalary * 0.0306);
  const preITS = brutSalary - inps - amo;
  let its = 0;
  if (preITS > 50000) its = Math.round((preITS - 50000) * 0.1); 
  
  const totalRetenues = inps + amo + its;
  const netToPay = brutSalary - totalRetenues;
  
  // Table Data Preparation
  const body: any[] = [
    ['Salaire de base', formatMoney(baseSalary), '', ''],
    ...primes.map(p => [p.label, formatMoney(p.amount), '', '']),
    [{ content: 'TOTAL SALAIRE BRUT', styles: { fontStyle: 'bold', fillColor: [240, 240, 245] } }, '', '', { content: formatMoney(brutSalary), styles: { fontStyle: 'bold', fillColor: [240, 240, 245] } }],
    ['Cotisation Sociale INPS (3.6%)', '', formatMoney(inps), ''],
    ['Assurance Maladie AMO (3.06%)', '', formatMoney(amo), ''],
    ['Impôt sur le Revenu (ITS)', '', formatMoney(its), ''],
    [{ content: 'TOTAL DES RETENUES', styles: { fontStyle: 'bold' } }, '', formatMoney(totalRetenues), ''],
  ];
  
  autoTable(doc, {
    startY: 105,
    margin: { left: 20, right: 20 },
    head: [['Description', 'Gains (+)', 'Retenues (-)', 'Total']],
    body: body,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor as [number, number, number], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
    }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Net to Pay Footer Block
  doc.setFillColor(40, 42, 54);
  doc.roundedRect(120, finalY, 70, 15, 2, 2, 'F');
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NET À PAYER', 125, finalY + 9.5);
  doc.setFontSize(12);
  doc.text(`${formatMoney(netToPay)} ${schoolSettings.currency || 'F CFA'}`, 185, finalY + 9.5, { align: 'right' });
  
  // Signatures
  const sigY = finalY + 40;
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text('Signature de l\'employé', 30, sigY);
  doc.text('Le Directeur Général', 140, sigY);
  
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('(précédé de la mention "Lu et approuvé")', 30, sigY + 5);
  
  doc.setDrawColor(200);
  doc.line(20, sigY + 20, 80, sigY + 20);
  doc.line(130, sigY + 20, 180, sigY + 20);
  
  // Footer page
  doc.setFontSize(8);
  doc.text(`Généré par EduFlow Pro le ${new Date().toLocaleString('fr-FR')}`, 105, 285, { align: 'center' });
  
  const pdfOutput = doc.output('arraybuffer');
  return await saveFile(new Uint8Array(pdfOutput), `fiche_paie_${teacher.lastName}_${dateStr.replace(' ', '_')}`, 'pdf');
}

/**
 * Downloads a JSON file (for backups)
 */
export async function downloadJSON(data: any, filename: string) {
  return await saveFile(JSON.stringify(data, null, 2), filename, 'json');
}

