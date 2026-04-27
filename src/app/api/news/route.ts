import { NextResponse } from 'next/server';

// Belgian Neighborhood coordinates for mapping
const GEO_ZONES: Record<string, {lat: number, lng: number}> = {
  'Ixelles': { lat: 50.8333, lng: 4.3667 },
  'Uccle': { lat: 50.8000, lng: 4.3333 },
  'Schaerbeek': { lat: 50.8667, lng: 4.3833 },
  'Etterbeek': { lat: 50.8333, lng: 4.3833 },
  'Molenbeek': { lat: 50.8500, lng: 4.3333 },
  'Anderlecht': { lat: 50.8333, lng: 4.3000 },
  'Evere': { lat: 50.8667, lng: 4.4000 },
  'Woluwe': { lat: 50.8333, lng: 4.4333 },
  'Jette': { lat: 50.8667, lng: 4.3333 },
  'Forest': { lat: 50.8167, lng: 4.3167 },
  'Auderghem': { lat: 50.8167, lng: 4.4167 },
  'Centre': { lat: 50.8466, lng: 4.3528 } // Bruxelles Centre
};

// Types corresponding to app logic
type IncidentType = 'burglary' | 'fire' | 'vandalism' | 'suspicious' | 'accident' | 'other';

const KEYWORDS: Record<IncidentType, string[]> = {
  'fire': ['feu', 'incendie', 'brûlé', 'flammes', 'fumée', 'pompier', 'explosion', 'gaz'],
  'burglary': ['vol', 'cambriolage', 'effraction', 'dérobé', 'braquage', 'arraché', 'intrusion', 'barillet', 'forcer', 'forcée'],
  'vandalism': ['dégradation', 'cassé', 'tag', 'détruit', 'brisé', 'vandalisme', 'saccagé', 'vitrine'],
  'suspicious': ['suspect', 'bizarre', 'étrange', 'rode', 'individu', 'repérage'],
  'accident': ['choc', 'encastré', 'percuté'], // Only if property damage likely
  'other': []
};

const NEGATIVE_KEYWORDS = [
    'noyade', 'noyé', 'fleuve', 'rivière', 'canal', 'senne',
    'stupéfiants', 'drogue', 'cannabis', 'cocaïne', 'trafic',
    'tribunal', 'jugé', 'condamné', 'prison', 'justice', 'procès', // Old news or legal
    'suicide', 'disparition', 'sexuelle', 'agression', 'harcèlement', // Tragique mais pas serrurerie
    'démission', 'politique', 'élection', 'grève', 'manifestation',
    'météo', 'sport', 'foot', 'racing', // Irrelevant
    'autoroute', 'A35', 'A4', 'peripherique' // Traffic accidents usually don't need locksmiths unless impact building
];

function getIncidentType(text: string): IncidentType {
  const lowerText = text.toLowerCase();
  
  // Check negative keywords first
  if (NEGATIVE_KEYWORDS.some(w => lowerText.includes(w))) {
      // Exception: If likely property damage involved despite negative words (e.g. "accident voiture encastrée")
      if (!lowerText.includes('encastré') && !lowerText.includes('feu')) {
          return 'other';
      }
  }

  for (const [type, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lowerText.includes(w))) return type as IncidentType;
  }
  return 'other';
}

function getLocation(text: string): { lat: number, lng: number, name: string } {
  const lowerText = text.toLowerCase();
  for (const [zone, coords] of Object.entries(GEO_ZONES)) {
    if (lowerText.includes(zone.toLowerCase())) {
        // Add random jitter to avoid stacking markers
        const jitterLat = (Math.random() - 0.5) * 0.005;
        const jitterLng = (Math.random() - 0.5) * 0.005;
        return { 
            lat: coords.lat + jitterLat, 
            lng: coords.lng + jitterLng, 
            name: zone 
        };
    }
  }
  
  // Default to random location in Centre if no specific zone found
  const center = GEO_ZONES['Centre'];
  return {
    lat: center.lat + (Math.random() - 0.5) * 0.02,
    lng: center.lng + (Math.random() - 0.5) * 0.02,
    name: "Bruxelles"
  };
}

export async function GET() {
  try {
    // Use Belgian News parameters
    const RSS_URL = "https://news.google.com/rss/search?q=Belgique+faits+divers+when:2d&hl=fr&gl=BE&ceid=BE:fr";
    const response = await fetch(RSS_URL);
    const xml = await response.text();

    // Simple Regex Parsing for RSS items
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
            const title = titleMatch[1].replace('<![CDATA[', '').replace(']]>', '');
            const link = linkMatch[1];
            const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
            
            const itemDate = new Date(pubDate);
            const today = new Date();
            
            // STRICT DATE FILTER: Must be same calendar day
            const isSameDay = itemDate.getDate() === today.getDate() &&
                            itemDate.getMonth() === today.getMonth() &&
                            itemDate.getFullYear() === today.getFullYear();

            // If it's not today, skip.
            if (!isSameDay) continue;

            const type = getIncidentType(title);
            
            // STRICT FILTERING: Only business relevant events
            if (type !== 'other') {
                const locationData = getLocation(title);

                items.push({
                id: Math.random().toString(36).substr(2, 9),
                type: type, 
                description: title,
                location: locationData.name,
                latitude: locationData.lat,
                longitude: locationData.lng,
                timestamp: itemDate.getTime(),
                source: 'Google News BE / Le Soir',
                url: link,
                metadata: {
                    priority: type === 'fire' || type === 'burglary' ? 'high' : 'medium'
                }
                });
            }
      }
    }

    // Fallback: If no news today, don't show old news. Return empty (or maybe 1 dummy verification if totally empty? No, user wants REAL).
    return NextResponse.json(items);
  } catch (error) {
    console.error("RSS Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
