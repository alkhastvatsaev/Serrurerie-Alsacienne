export const BUSINESS_CONFIG = {
  name: "Serrurerie Pro Belgique",
  shortName: "SerrurePro BE",
  legalName: "Serrurerie Pro SRL",
  vatNumber: "BE 0741.852.963", // Exemple de format belge
  address: {
    street: "Avenue Louise 120",
    city: "Bruxelles",
    zip: "1050",
    country: "Belgique"
  },
  contact: {
    phone: "+32 2 511 22 33",
    email: "contact@serrurerie-pro.be",
    website: "https://serrurerie-pro.be"
  },
  settings: {
    currency: "EUR",
    defaultVat: 21, // Taux standard Belgique
    reducedVat: 6,  // Taux rénovation Belgique (>10 ans)
    timezone: "Europe/Brussels"
  },
  colors: {
    primary: "#C5A028", // Gold/Brass
    secondary: "#0F172A", // Navy Blue
    accent: "#F59E0B"
  }
};
