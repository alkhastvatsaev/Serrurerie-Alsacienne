import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Intervention, InventoryItem } from '@/types';

const COMPANY_INFO = {
  name: "Serrurerie Bruxelloise",
  address: "Avenue Louise 120, 1050 Bruxelles",
  phone: "+32 2 511 22 33",
  email: "contact@serrurerie-bruxelloise.be",
  vat: "BE 0741.852.963"
};

const calculateTotals = (intervention: Intervention, inventory: InventoryItem[]) => {
  const parts = intervention.parts_used.map(pu => {
    const item = inventory.find(i => i.id === pu.item_id);
    const price = item?.price ?? 0;
    return {
      name: item?.item_name || 'Pièce inconnue',
      price,
      quantity: pu.quantity,
      total: price * pu.quantity
    };
  });

  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const laborTotal = intervention.labor_cost || 0;
  const travelTotal = intervention.travel_cost || 0;
  const totalHT = partsTotal + laborTotal + travelTotal;
  const totalTVA = totalHT * 0.21; // TVA Belge par défaut
  const totalTTC = totalHT + totalTVA;

  return { parts, partsTotal, laborTotal, travelTotal, totalHT, totalTVA, totalTTC };
};

export const downloadPDF = async (type: 'QUOTE' | 'INVOICE' | 'INTERVENTION', intervention: Intervention, inventory: InventoryItem[]) => {
  const doc = new jsPDF();
  const totals = calculateTotals(intervention, inventory);

  // Logo & Header
  doc.setFontSize(22);
  doc.setTextColor(197, 160, 40); // Gold #C5A028
  doc.text(COMPANY_INFO.name, 20, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(COMPANY_INFO.address, 20, 38);
  doc.text(`Tél: ${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, 20, 43);
  doc.text(`TVA: ${COMPANY_INFO.vat}`, 20, 48);

  // Document Type & Info
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Navy #0F172A
  const title = type === 'QUOTE' ? 'DEVIS' : type === 'INVOICE' ? 'FACTURE' : 'RAPPORT D\'INTERVENTION';
  doc.text(title, 120, 30);
  
  doc.setFontSize(10);
  doc.text(`Réf: ${intervention.id.slice(0, 8).toUpperCase()}`, 120, 38);
  doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 120, 43);
  doc.text(`Technicien: ${intervention.tech_id}`, 120, 48);

  // Client Info
  doc.setDrawColor(200);
  doc.line(20, 55, 190, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT:', 20, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(intervention.client_id, 20, 70);

  // Intervention Details
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION DES TRAVAUX:', 20, 85);
  doc.setFont('helvetica', 'normal');
  const descriptionLines = doc.splitTextToSize(intervention.description || 'Aucune description fournie', 170);
  doc.text(descriptionLines, 20, 90);

  // Items Table
  const tableData = [
    ...totals.parts.map(p => [p.name, p.quantity, `${p.price.toFixed(2)} €`, `${p.total.toFixed(2)} €`]),
    ['Main d\'œuvre', '1', `${totals.laborTotal.toFixed(2)} €`, `${totals.laborTotal.toFixed(2)} €`],
    ['Déplacement', '1', `${totals.travelTotal.toFixed(2)} €`, `${totals.travelTotal.toFixed(2)} €`]
  ];

  (doc as any).autoTable({
    startY: 110,
    head: [['Désignation', 'Qté', 'Prix U. HT', 'Total HT']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total HT: ${totals.totalHT.toFixed(2)} €`, 140, finalY);
  doc.text(`TVA (21%): ${totals.totalTVA.toFixed(2)} €`, 140, finalY + 7);
  doc.setFontSize(12);
  doc.setTextColor(197, 160, 40);
  doc.text(`TOTAL TTC: ${totals.totalTTC.toFixed(2)} €`, 140, finalY + 15);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Merci de votre confiance. ${COMPANY_INFO.name} - Service d'urgence 24/7`, 20, 280);

  // Download
  const fileName = `${title.toLowerCase().replace(/ /g, '-')}-${intervention.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
};

export const sendPDFByEmail = async (type: string, intervention: Intervention, inventory: InventoryItem[]) => {
  console.log(`Sending ${type} for intervention ${intervention.id} by email...`);
  // Mock implementation
  return new Promise(resolve => setTimeout(resolve, 1000));
};
