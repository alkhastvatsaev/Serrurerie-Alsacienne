
export const sendWhatsAppMessage = (phone: string, text: string) => {
  // Clean phone number (remove spaces, dots, etc.) and ensure it has a country code
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // If it starts with 0 and is 10 digits (French standard), replace 0 with 33
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '33' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('33') && (cleanPhone.startsWith('6') || cleanPhone.startsWith('7'))) {
    // Add 33 if missing for French mobiles
    cleanPhone = '33' + cleanPhone;
  }

  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}/?text=${encodedText}`;
  window.open(url, '_blank');
};

export const whatsappTemplates = {
  dispatchToTech: (techName: string, intervention: any) => {
    return `🚀 NOUVELLE MISSION - ${techName}\n\n📍 Adresse: ${intervention.address}\n🕒 Heure: ${intervention.time}\n🛠️ Type: ${intervention.category || 'Maintenance'}\n📝 Note: ${intervention.description || 'Aucune'}\n\nBon courage ! 💪`;
  },
  
  etaToClient: (techName: string, minutes: number) => {
    return `Bonjour, c'est ${techName} de SERRURE Strasbourg. 🛠️ Je suis en route pour votre intervention. Arrivée prévue dans environ ${minutes} minutes. À tout de suite !`;
  },
  
  confirmationToClient: (clientName: string, intervention: any) => {
    return `Bonjour ${clientName}, votre intervention est confirmée pour le ${intervention.date} à ${intervention.time}. Notre technicien se présentera à l'adresse: ${intervention.address}. Merci de votre confiance ! 🔒`;
  },

  reportReady: (clientName: string, type: string) => {
    return `Bonjour ${clientName}, votre ${type === 'INVOICE' ? 'facture' : 'devis'} est disponible. Vous pouvez le consulter via le lien envoyé par email ou nous demander une copie ici. Belle journée ! ✨`;
  }
};
