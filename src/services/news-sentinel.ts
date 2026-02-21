
import { SecurityIncident } from "@/services/ai-agent";

// Advanced Sentinel System for Strasbourg News Intelligence
// Simulates a high-tech "listening" system that aggregates Fire, Police, and Social Media feeds.

export interface NewsSentinelConfig {
  scanFrequency: number;
  sensitivity: 'low' | 'medium' | 'high';
  activeSources: string[];
}

export interface SentinelEvent extends SecurityIncident {
  metrics: {
    credibilityAttr: number; // 0-100
    impactRadius: number; // in meters
    socialVelocity: number; // mentions per minute
  };
  rawFeed?: string;
  detectedKeywords?: string[];
}

// 1. STRASBOURG GEO-ZONES (High precision for accurate plotting)
// Constants removed - using real API data.

// 3. THE SENTINEL ENGINE
export class NewsSentinel {
  
  static async fetchRealEvents(): Promise<SentinelEvent[]> {
    try {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error('Failed to fetch news');
        const items = await response.json();

        return items.map((item: any) => ({
            id: item.id,
            type: item.type,
            location: item.location,
            description: item.description,
            timestamp: new Date(item.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            latitude: item.latitude,
            longitude: item.longitude,
            source: 'DNA / Google News',
            sourceUrl: item.url,
            urgency: item.metadata?.priority === 'high' ? 'high' : 'medium',
            isVerified: true,
            metrics: {
                credibilityAttr: 90,
                impactRadius: 500,
                socialVelocity: 10
            },
            locksmithAngle: this.getLocksmithAngle(item.type, item.description),
            salesPitch: "Intervention rapide recommandée.",
            recommendedAction: "Envoyer alerte secteur.",
            potentialRevenue: 400,
            engagementRisk: 10
        }));
    } catch (e) {
        console.error("Sentinel Error:", e);
        return [];
    }
  }

  static getLocksmithAngle(type: string, description: string): string {
    const desc = description.toLowerCase();
    
    if (type === 'fire') {
        if (desc.includes('appartement') || desc.includes('maison')) return "Contrôle accès après incendie. Remplacement cylindres (clés perdues dans panique).";
        return "Portes coupe-feu potentiellement forcées par les secours. Vérification urgente.";
    }
    
    if (type === 'burglary') {
        if (desc.includes('tentative')) return "Renforcement porte (cornières anti-pinces) + serrure A2P***.";
        if (desc.includes('cave') || desc.includes('garage')) return "Pose verrous de blocage et barres de sécurité.";
        return "Mise en sécurité immédiate post-effraction. Remplacement à l'identique.";
    }
    
    if (type === 'vandalism') {
        if (desc.includes('vitrine')) return "Fermeture provisoire (contre-plaqué) avant remplacement vitrage.";
        if (desc.includes('boîtes') || desc.includes('lettres')) return "Devis remplacement blocs boîtes aux lettres (copropriété).";
        if (desc.includes('tag')) return "Nettoyage graffiti + vérification gâche électrique.";
        return "Réparation porte hall d'entrée (souvent forcée/bloquée).";
    }

    if (type === 'accident') {
        return "Vérifier si impact sur vitrine ou rideau métallique. Sécurisation périmètre.";
    }

    if (type === 'suspicious') {
        return "Prospection préventive: Proposer audit sécurité gratuit au quartier.";
    }

    return "Veille stratégique.";
  }

  // Simulate a live feed connection
  static startListening(callback: (event: SentinelEvent) => void) {
    // Initial fetch
    this.fetchRealEvents().then(events => {
        events.forEach(e => callback(e));
    });

    // Poll every 5 minutes
    const interval = setInterval(() => {
        this.fetchRealEvents().then(events => {
             events.forEach(e => callback(e));
        });
    }, 300000); 
  }
}
