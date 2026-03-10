
/**
 * Gmail Service for Serrurerie Alsacienne
 * Requires Google OAuth2 credentials to be set in .env.local
 */

export interface GmailMessage {
  id: string;
  snippet: string;
  date: string;
  from: string;
  subject: string;
}

export async function fetchCustomerEmails(email: string): Promise<GmailMessage[]> {
  // If no email provided, return empty
  if (!email) return [];

  try {
    // This would call our internal API route that handles the OAuth token
    const response = await fetch(`/api/gmail/search?q=${encodeURIComponent(email)}`);
    if (!response.ok) {
        // Fallback or demo mode
        console.warn("Gmail API not fully configured or linked. Returning demo data.");
        return [
            {
                id: 'demo-1',
                from: 'alkhastvatsaev@gmail.com',
                subject: 'Demande de devis - Serrure Porte Blindée',
                snippet: 'Bonjour, je souhaiterais obtenir un devis pour le remplacement de ma serrure Fichet...',
                date: new Date().toISOString()
            }
        ];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Gmail fetch error:", e);
    return [];
  }
}
