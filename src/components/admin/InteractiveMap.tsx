"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Polygon, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useStore } from "@/store/useStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Move, Save, Pencil, MapPin, Phone, Clock } from "lucide-react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import React from "react";
import { MessageSquare, Phone as PhoneIcon } from "lucide-react";
import { sendWhatsAppMessage, whatsappTemplates } from "@/services/whatsapp";
import { Intervention, User } from "@/types";
import { SecurityIncident } from "@/services/ai-agent";
import { getTechColor } from '@/lib/theme';

// 1. Icon Cache to prevent flickering
const iconCache: Record<string, L.DivIcon> = {};

// 1. Icon for Technicians (Human Avatars)
const getTechIcon = (color: string, initial: string, avatarUrl?: string) => {
  const key = `tech-${color}-${initial}-${avatarUrl || ''}`;
  if (!iconCache[key]) {
    iconCache[key] = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; width: 36px; height: 36px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background-color: ${color};">
          <span style="color: white; font-weight: 900; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: -0.5px;">${initial}</span>
        </div>
        <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${color}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));"></div>
      </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 42],
    });
  }
  return iconCache[key];
};

// 2. Icon for Interventions (House/Building style)
const getInterventionIcon = (status: string, order?: number, techColor?: string) => {
  const key = `int-${status}-${order || 0}-${techColor || ''}`;
  if (!iconCache[key]) {
    let color = '#FF3B30'; // Red for pending
    if (status === 'done') color = '#34C759'; // Green for done
    if (status === 'waiting_approval') color = '#FF9500'; // Orange for validation

    iconCache[key] = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="background: ${color}; width: 32px; height: 32px; border-radius: 10px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        ${order ? `<div style="position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: ${techColor || 'black'}; color: white; padding: 1px 7px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 10; white-space: nowrap;">#${order}</div>` : ''}
        <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${color};"></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 38],
    });
  }
  return iconCache[key];
};

// --- BELGIUM SPECIFIC DATA ---
const BRUSSELS_CENTER: [number, number] = [50.8503, 4.3517];

// Optimized Belgium Base Positions (Brussels surroundings)
const BASE_POSITIONS: Record<string, [number, number]> = {
  '2': [50.8503, 4.3517], // Marc - Brussels Center
  '3': [50.8195, 4.3826], // Sophie - Ixelles
  '4': [50.8427, 4.3211], // Lucas - Anderlecht
  '5': [50.8814, 4.3411], // Hugo - Laeken
  '6': [50.8333, 4.4000], // Yanis - Etterbeek
  '7': [50.8587, 4.4123], // Thomas - Schaerbeek
};

// More detailed Belgium Border (approx. 40 points)
const BELGIUM_BORDER_GEOJSON: [number, number][] = [
    [51.503, 3.340], [51.350, 4.000], [51.450, 4.500], [51.480, 4.800], [51.500, 5.200],
    [51.400, 5.600], [51.200, 5.900], [51.100, 6.100], [50.800, 6.000], [50.600, 6.300],
    [50.300, 6.450], [50.150, 6.200], [50.100, 6.000], [49.800, 5.900], [49.500, 5.750],
    [49.550, 5.500], [49.650, 5.200], [49.800, 5.000], [49.950, 4.800], [50.000, 4.500],
    [50.050, 4.200], [50.150, 4.000], [50.250, 3.800], [50.350, 3.500], [50.500, 3.300],
    [50.700, 3.100], [50.850, 2.900], [51.000, 2.700], [51.150, 2.550], [51.300, 3.000],
    [51.400, 3.150], [51.503, 3.340]
];

// Inverted World Mask
const WORLD_MASK: [number, number][][] = [
    [[-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]],
    BELGIUM_BORDER_GEOJSON
];

// Belgium Bounding Box for maxBounds
const BELGIUM_BOUNDS: L.LatLngBoundsExpression = [
    [49.3, 2.3], // Southwest
    [51.7, 6.6]  // Northeast
];

const getInterpolatedPosition = (geometry: [number, number][], progress: number): [number, number] => {
  if (!geometry || geometry.length === 0) return BRUSSELS_CENTER;
  const index = Math.min(Math.floor(geometry.length * progress), geometry.length - 1);
  return geometry[index];
};

interface TechMarkerProps {
  tech: User;
  interventions: Intervention[];
  routingData: Record<string, { duration: number, distance: number, geometry: [number, number][] }>;
  onContactTech?: (id: string) => void;
  basePos: [number, number];
}

const TechMarker = ({ tech, interventions, routingData, onContactTech, basePos }: TechMarkerProps) => {
    const markerRef = useRef<any>(null);
    const initial = tech.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const color = getTechColor(tech.id);
    const [initialPosition] = useState(basePos);
    
    useEffect(() => {
        let animFrame: number;
        const startTime = Date.now();
        
        const updatePos = () => {
            if (!markerRef.current) {
                animFrame = requestAnimationFrame(updatePos);
                return;
            }

            const simTime = (Date.now() - startTime) / 1000;
            const activeMission = interventions.find((i) => i.tech_id === tech.id && i.status !== 'done');
            const routeInfo = activeMission ? routingData[activeMission.id] : null;
            
            let pos: [number, number];
            if (routeInfo && routeInfo.geometry.length > 0 && routeInfo.distance > 0) {
                const SPEED_KMH = 30;
                const durationSeconds = (routeInfo.distance / SPEED_KMH) * 3600;
                const offset = parseInt(tech.id) * 1000; 
                const progress = ((simTime + offset) % durationSeconds) / durationSeconds;
                pos = getInterpolatedPosition(routeInfo.geometry, progress);
            } else {
                const idleOffsetLat = Math.sin(simTime * 0.5) * 0.0002;
                const idleOffsetLon = Math.cos(simTime * 0.5) * 0.0002;
                pos = [basePos[0] + idleOffsetLat, basePos[1] + idleOffsetLon];
            }

            if (markerRef.current && markerRef.current._map) {
                markerRef.current.setLatLng(pos);
            }
            animFrame = requestAnimationFrame(updatePos);
        };

        animFrame = requestAnimationFrame(updatePos);
        return () => cancelAnimationFrame(animFrame);
    }, [tech.id, interventions, routingData, basePos]);

    const icon = useMemo(() => getTechIcon(color, initial, tech.avatar_url), [color, initial, tech.avatar_url]);

    return (
        <Marker 
            ref={markerRef}
            position={initialPosition} 
            icon={icon} 
            zIndexOffset={1000}
        >
            <Popup className="apple-popup">
                <div className="p-3 min-w-[180px] ios-card border-none shadow-none text-center">
                    <div className="w-12 h-12 rounded-full mx-auto bg-secondary flex items-center justify-center font-black text-lg text-foreground mb-2 border-2 border-white shadow-sm tech-color-icon" style={{ '--tech-color': color } as React.CSSProperties}>
                        {initial}
                    </div>
                    <p className="text-sm font-black text-foreground mb-0.5">{tech.name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Position Live</p>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            className="flex-1 h-8 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest"
                            onClick={() => onContactTech?.(tech.id)}
                        >
                            Détails
                        </Button>
                        <button 
                            onClick={() => {
                                if (tech.phone) sendWhatsAppMessage(tech.phone, `Bonjour ${tech.name}, vous êtes disponible pour un point ? 📞`);
                            }}
                            title="Contacter sur WhatsApp"
                            aria-label="Contacter sur WhatsApp"
                            className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-100">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

const MapContent = ({ 
    onSelectIntervention, 
    onContactTech,
    prospects = [],
    incidents = [],
    isZoneEditMode 
}: { 
    onSelectIntervention: (int: Intervention) => void, 
    onContactTech?: (techId: string) => void,
    prospects?: Array<{ display_name: string, lat: string, lon: string }>,
    incidents?: SecurityIncident[],
    isZoneEditMode: boolean
}): React.JSX.Element | null => {
    const map = useMap();
    const { interventions, users, deleteIntervention, zones, updateZones, suppliers } = useStore();
    const [routingData, setRoutingData] = useState<Record<string, { duration: number, distance: number, geometry: [number, number][] }>>({});

    useEffect(() => {
        const fetchRoutes = async () => {
            const newRouting: Record<string, { duration: number, distance: number, geometry: [number, number][] }> = {};
            const activeByTech: Record<string, Intervention[]> = {};
            interventions.forEach(int => {
                if (int.status === 'done' || !int.tech_id) return;
                if (!activeByTech[int.tech_id]) activeByTech[int.tech_id] = [];
                activeByTech[int.tech_id].push(int);
            });

            for (const techId in activeByTech) {
                const techInts = activeByTech[techId].sort((a, b) => a.time.localeCompare(b.time));
                let lastPos = BASE_POSITIONS[techId] || BRUSSELS_CENTER;

                for (const int of techInts) {
                    const intPos: [number, number] = (int.latitude && int.longitude) ? [int.latitude, int.longitude] : BRUSSELS_CENTER;
                    try {
                        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lastPos[1]},${lastPos[0]};${intPos[1]},${intPos[0]}?overview=full&geometries=geojson`);
                        const data = await res.json();
                        if (data.routes?.[0]) {
                            const geometry = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                            newRouting[int.id] = { duration: data.routes[0].duration / 60, distance: data.routes[0].distance / 1000, geometry };
                        }
                    } catch (err) { 
                        newRouting[int.id] = { duration: 0, distance: 0, geometry: [lastPos, intPos] };
                    }
                    lastPos = intPos;
                }
            }
            setRoutingData(prev => ({ ...prev, ...newRouting }));
        };
        fetchRoutes();
    }, [interventions]);

    return (
        <React.Fragment>
            {/* 1. MINIMALIST BASE MAP */}
            <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
            />

            {/* 2. MASK EVERYTHING EXCEPT BELGIUM */}
            <Polygon 
                positions={WORLD_MASK} 
                pathOptions={{ 
                    fillColor: "white", 
                    fillOpacity: 1, 
                    color: "transparent", 
                    weight: 0 
                }} 
            />

            {/* 3. BELGIUM BORDER GLOW */}
            <Polygon 
                positions={BELGIUM_BORDER_GEOJSON}
                pathOptions={{ color: "#C5A028", weight: 2, fillOpacity: 0, opacity: 0.5 }}
            />

            {/* 4. CONTENT */}
            {zones.map((zone) => (
                <Polygon
                    key={zone.techId}
                    positions={zone.positions.map(p => [p.lat, p.lng] as [number, number])}
                    pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.1, weight: 1 }}
                />
            ))}

            {interventions.map((int) => {
                const pos: [number, number] = [int.latitude || 50.85, int.longitude || 4.35];
                const color = int.tech_id ? getTechColor(int.tech_id) : '#FF3B30';
                return (
                    <React.Fragment key={int.id}>
                        <Marker position={pos} icon={getInterventionIcon(int.status, undefined, color)}>
                            <Popup className="apple-popup">
                                <div className="p-3">
                                    <h3 className="font-black text-sm">{int.address}</h3>
                                    <Button size="sm" className="w-full mt-2" onClick={() => onSelectIntervention(int)}>Dossier</Button>
                                </div>
                            </Popup>
                        </Marker>
                        {int.tech_id && routingData[int.id] && (
                            <Polyline positions={routingData[int.id].geometry} color={color} weight={2} opacity={0.6} dashArray="5, 10" />
                        )}
                    </React.Fragment>
                );
            })}

            {users.filter(u => u.role === 'tech').map((tech) => (
                <TechMarker 
                    key={tech.id} 
                    tech={tech} 
                    interventions={interventions} 
                    routingData={routingData} 
                    onContactTech={onContactTech}
                    basePos={BASE_POSITIONS[tech.id] || BRUSSELS_CENTER}
                />
            ))}
        </React.Fragment>
    );
};

export default function InteractiveMap({ 
    onSelectIntervention, 
    onContactTech,
    isZoneEditMode = false 
}: { 
    onSelectIntervention: (int: Intervention) => void, 
    onContactTech?: (techId: string) => void,
    prospects?: any[],
    incidents?: any[],
    isZoneEditMode?: boolean
}) {
  return (
    <div className="h-full w-full bg-white">
      <MapContainer 
        center={BRUSSELS_CENTER} 
        zoom={8} 
        minZoom={7.5}
        maxZoom={18}
        maxBounds={BELGIUM_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        attributionControl={false} 
        style={{ height: "100%", width: "100%", background: "white" }}
      >
        <MapContent 
            onSelectIntervention={onSelectIntervention} 
            onContactTech={onContactTech}
            isZoneEditMode={isZoneEditMode}
        />
      </MapContainer>
    </div>
  );
}
