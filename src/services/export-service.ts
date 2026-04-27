import { Intervention, InventoryItem } from '@/types';

export const exportToCSV = (interventions: Intervention[], inventory: InventoryItem[]) => {
  // 1. Filter interventions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const filtered = interventions.filter(int => {
    const intDate = new Date(int.date);
    return int.status === 'done' && intDate >= thirtyDaysAgo;
  });

  if (filtered.length === 0) {
    throw new Error("Aucune intervention terminée sur les 30 derniers jours.");
  }

  // 2. Helper to calculate total (mirroring the UI logic)
  const calculateTotal = (int: Intervention) => {
    const partsTotal = int.parts_used.reduce((pSum, pu) => {
      const item = inventory.find(i => i.id === pu.item_id);
      return pSum + (item?.price || 0) * pu.quantity;
    }, 0);
    const laborBase = int.labor_cost || 80;
    const subtotal = partsTotal + laborBase;
    const multiplier = int.is_emergency ? 1.5 : 1;
    const discount = int.discount || 0;
    return Math.round((subtotal * multiplier) - discount);
  };

  // 3. Define CSV Headers (FEC simplified format)
  const headers = [
    'Date',
    'Reference_Intervention',
    'Client_Adresse',
    'Mode_Paiement',
    'Statut_Paiement',
    'Montant_HT_Estime',
    'TVA_20',
    'Montant_TTC',
    'Technicien_ID'
  ];

  // 4. Generate Rows
  const csvRows = filtered.map(int => {
    const TTC = calculateTotal(int);
    const HT = Math.round(TTC / 1.2);
    const TVA = TTC - HT;

    return [
      int.date,
      `INT-${int.id.substring(0, 8).toUpperCase()}`,
      `"${int.address.replace(/"/g, '""')}"`,
      int.payment_method || 'N/A',
      int.payment_status,
      HT,
      TVA,
      TTC,
      int.tech_id
    ].join(';');
  });

  // 5. Combine and Create Blob
  const csvContent = [headers.join(';'), ...csvRows].join('\n');
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const url = URL.createObjectURL(blob);
  
  // 6. Trigger Download
  const link = document.createElement('a');
  const fileName = `Export_Compta_J30_${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
