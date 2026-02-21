
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Intervention, InventoryItem } from '@/types';

const COMPANY_INFO = {
  name: "SMART LOCK ELITE",
  address: "17 Rue des Serruriers, 67000 Strasbourg",
  phone: "03 88 00 11 22",
  email: "contact@serrurerie-alsacienne.fr",
  siret: "888 111 222 00011"
};

const calculateTotals = (intervention: Intervention, inventory: InventoryItem[]) => {
  const partsDetails = intervention.parts_used.map(pu => {
    const item = inventory.find(i => i.id === pu.item_id);
    return {
      name: item?.item_name || 'Pièce inconnue',
      quantity: pu.quantity,
      price: item?.price || 0,
      total: (item?.price || 0) * pu.quantity
    };
  });

  const partsTotal = partsDetails.reduce((sum, p) => sum + p.total, 0);
  const labor = intervention.labor_cost || 80;
  const subtotal = partsTotal + labor;
  const multiplier = intervention.is_emergency ? 1.5 : 1;
  const emergencySurcharge = intervention.is_emergency ? subtotal * 0.5 : 0;
  const discount = intervention.discount || 0;
  const total = Math.round((subtotal * multiplier) - discount);

  return { partsDetails, partsTotal, labor, emergencySurcharge, discount, total };
};

export const generatePDFDocument = async (
  type: 'QUOTE' | 'INVOICE',
  intervention: Intervention,
  inventory: InventoryItem[]
) => {
  const doc = new jsPDF();
  const { partsDetails, labor, emergencySurcharge, discount, total } = calculateTotals(intervention, inventory);
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_INFO.name, 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(COMPANY_INFO.address, 20, 38);
  doc.text(`Tél: ${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, 20, 43);
  doc.text(`SIRET: ${COMPANY_INFO.siret}`, 20, 48);

  // Document Type & Info
  doc.setFontSize(18);
  doc.setTextColor(0);
  const title = type === 'QUOTE' ? 'DEVIS ESTIMATIF' : 'FACTURE';
  (doc as any).text(title, 140, 30);
  
  doc.setFontSize(10);
  (doc as any).text(`N°: ${type === 'QUOTE' ? 'D' : 'F'}-${intervention.id.slice(0, 8).toUpperCase()}`, 140, 38);
  (doc as any).text(`Date: ${intervention.date}`, 140, 43);

  // Client Info Box
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, 60, 170, 30, 3, 3, 'FD');
  doc.setTextColor(100);
  (doc as any).text('DESTINATAIRE :', 25, 68);
  doc.setTextColor(0);
  doc.setFontSize(12);
  (doc as any).text(intervention.address, 25, 76);

  // Table
  const tableRows = [
    ['Main d\'œuvre & Déplacement', '1', `${labor} €`, `${labor} €`],
    ...partsDetails.map(p => [p.name, p.quantity.toString(), `${p.price} €`, `${p.total} €`])
  ];

  if (emergencySurcharge > 0) {
    tableRows.push(['Majoration Urgence (x1.5)', '1', '-', `${Math.round(emergencySurcharge)} €`]);
  }

  if (discount > 0) {
    tableRows.push(['Remise commerciale', '1', '-', `-${discount} €`]);
  }

  autoTable(doc, {
    startY: 100,
    head: [['Description', 'Qté', 'Prix Unitaire', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  // Totals
  doc.setFontSize(12);
  (doc as any).text(`TOTAL T.T.C :`, 140, finalY + 5);
  doc.setFontSize(16);
  (doc as any).text(`${total} €`, 175, finalY + 5, { align: 'right' });

  if (type === 'INVOICE' && intervention.payment_method) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    const methodLabel = intervention.payment_method === '3x' ? 'Paiement en 3 fois (Installments)' : intervention.payment_method.toUpperCase();
    (doc as any).text(`Mode de paiement: ${methodLabel}`, 140, finalY + 15);
    doc.setTextColor(0);
  }

  // QR Code
  const qrData = `https://smartlock-verified.com/verify/${intervention.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData);
  doc.addImage(qrCodeDataUrl, 'PNG', 20, finalY, 30, 30);
  doc.setFontSize(8);
  doc.setTextColor(150);
  (doc as any).text('Scannez pour vérifier l\'authenticité', 20, finalY + 35);

  // Signature
  if (type === 'INVOICE' && intervention.customer_signature) {
    (doc as any).text('SIGNATURE CLIENT :', 140, finalY + 25);
    doc.addImage(intervention.customer_signature, 'PNG', 140, finalY + 30, 40, 20);
  } else if (type === 'QUOTE') {
    (doc as any).text('B.P.A (Bon Pour Accord) :', 140, finalY + 25);
    doc.setDrawColor(200, 200, 200);
    doc.line(140, finalY + 45, 180, finalY + 45);
  }

  // Photos (Invoices only)
  if (type === 'INVOICE' && intervention.photos_url && intervention.photos_url.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('PHOTOS DE L\'INTERVENTION', 20, 20);
    
    let photoY = 30;
    for (let i = 0; i < intervention.photos_url.length; i++) {
        if (photoY > 240) {
            doc.addPage();
            photoY = 30;
        }
        try {
            doc.text(`Photo ${i + 1}`, 20, photoY);
            photoY += 70;
        } catch (e) {}
    }
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    (doc as any).text('Document généré par SMART LOCK MANAGER - Solution Pro', 105, 290, { align: 'center' });
  }

  return doc;
};

export const downloadPDF = async (
  type: 'QUOTE' | 'INVOICE',
  intervention: Intervention,
  inventory: InventoryItem[]
) => {
  const doc = await generatePDFDocument(type, intervention, inventory);
  doc.save(`${type === 'QUOTE' ? 'Devis' : 'Facture'}_${intervention.id.slice(0,8)}.pdf`);
};

export const sendPDFByEmail = async (
  type: 'QUOTE' | 'INVOICE',
  intervention: Intervention,
  inventory: InventoryItem[]
) => {
  try {
    const doc = await generatePDFDocument(type, intervention, inventory);
    
    // Convert PDF to base64 for transmission
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const filename = `${type === 'QUOTE' ? 'Devis' : 'Facture'}_${intervention.id.slice(0,8)}.pdf`;

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64,
        filename,
        type,
        interventionId: intervention.id,
        address: intervention.address
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || result.error || 'Erreur lors de l\'envoi');
    
    return true;
  } catch (err) {
    console.error('Email Send Error:', err);
    throw err;
  }
};
