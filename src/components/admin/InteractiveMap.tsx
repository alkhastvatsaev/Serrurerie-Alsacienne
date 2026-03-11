
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
import { sendWhatsAppMessage, whatsappTemplates } from "@/lib/whatsapp";
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
        <div style="background: white; width: 36px; height: 36px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: ${color};">
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

// Initial Base Positions in Strasbourg neighborhoods (Source of Truth)
const BASE_POSITIONS: Record<string, [number, number]> = {
  '2': [48.5830, 7.7540], // Marc - Krutenau / Hyper-centre
  '3': [48.5980, 7.7725], // Sophie - Orangerie / Institutions
  '4': [48.5660, 7.7610], // Lucas - Neudorf / Sud 
  '5': [48.6060, 7.7470], // Hugo - Schiltigheim
  '6': [48.5280, 7.7120], // Yanis - Illkirch
  '7': [48.5600, 7.7500], // Thomas - La Meinau
};

const JOB_LOCATIONS: Record<string, [number, number]> = {
  'int1': [48.5819, 7.7535],
  'int2': [48.5910, 7.7710],
  'int3': [48.5750, 7.7400],
};

const getInterpolatedPosition = (geometry: [number, number][], progress: number): [number, number] => {
  if (!geometry || geometry.length === 0) return [48.5830, 7.7480];
  const index = Math.min(Math.floor(geometry.length * progress), geometry.length - 1);
  return geometry[index];
};

// 3. Optimized TechMarker Component with Direct DOM Manipulation
interface TechMarkerProps {
  tech: User;
  interventions: Intervention[];
  routingData: Record<string, { duration: number, distance: number, geometry: [number, number][] }>;
  onContactTech?: (id: string) => void;
  basePos: [number, number];
}

const TechMarker = ({ tech, interventions, routingData, onContactTech, basePos }: TechMarkerProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                const distanceKm = routeInfo.distance;
                const durationSeconds = (distanceKm / SPEED_KMH) * 3600;
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
                    <div className="w-12 h-12 rounded-full mx-auto bg-secondary flex items-center justify-center font-black text-lg text-foreground mb-2 border-2 border-white shadow-sm" style={{ color }}>
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
    const { interventions, users, assets, clients, deleteIntervention, zones, updateZones, suppliers } = useStore();
    const [routingData, setRoutingData] = useState<Record<string, { duration: number, distance: number, geometry: [number, number][] }>>({});

    useEffect(() => {
        const fetchRoutes = async () => {
            const newRouting: Record<string, { duration: number, distance: number, geometry: [number, number][] }> = {};
            
            // Group and sort active interventions per tech
            const activeInterventionsByTech: Record<string, Intervention[]> = {};
            interventions.forEach(int => {
                if (int.status === 'done' || !int.tech_id) return;
                if (!activeInterventionsByTech[int.tech_id]) activeInterventionsByTech[int.tech_id] = [];
                activeInterventionsByTech[int.tech_id].push(int);
            });

            for (const techId in activeInterventionsByTech) {
                const techInts = activeInterventionsByTech[techId].sort((a, b) => {
                    // Priority 1: Emergencies
                    if (a.is_emergency && !b.is_emergency) return -1;
                    if (!a.is_emergency && b.is_emergency) return 1;
                    // Priority 2: Time
                    return a.time.localeCompare(b.time);
                });

                let lastPos = BASE_POSITIONS[techId];
                if (!lastPos) continue;

                for (const int of techInts) {
                    const intPos: [number, number] = (int.latitude && int.longitude) 
                        ? [int.latitude, int.longitude] 
                        : (JOB_LOCATIONS[int.id] || [48.5830, 7.7480]);
                    
                    try {
                        const url = `https://router.project-osrm.org/route/v1/driving/${lastPos[1]},${lastPos[0]};${intPos[1]},${intPos[0]}?overview=full&geometries=geojson`;
                        const res = await fetch(url);
                        const data = await res.json();
                        if (data.routes && data.routes.length > 0) {
                            const rawDurationMinutes = data.routes[0].duration / 60;
                            const realisticDuration = Math.round((rawDurationMinutes * 3.2) + 2);
                            const geometry = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                            newRouting[int.id] = { duration: realisticDuration, distance: data.routes[0].distance / 1000, geometry };
                        }
                    } catch (err) { 
                        console.error("OSRM error:", err); 
                        // Fallback: simple line if OSRM fails
                        newRouting[int.id] = { duration: 0, distance: 0, geometry: [lastPos, intPos] };
                    }
                    lastPos = intPos; // Next route starts from here
                }
            }
            setRoutingData(prev => ({ ...prev, ...newRouting }));
        };
        fetchRoutes();
        const routeInterval = setInterval(fetchRoutes, 60000); 
        return () => clearInterval(routeInterval);
    }, [interventions, users]);

    const memoizedInterventions = useMemo(() => {
        // Pre-calculate order for numbering
        const techInterventionOrder: Record<string, string[]> = {};
        interventions.forEach(int => {
            if (int.status === 'done' || !int.tech_id) return;
            if (!techInterventionOrder[int.tech_id]) techInterventionOrder[int.tech_id] = [];
            techInterventionOrder[int.tech_id].push(int.id);
        });

        // Sort them the same way as in routing
        for (const tid in techInterventionOrder) {
            techInterventionOrder[tid].sort((aid, bid) => {
                const a = interventions.find(i => i.id === aid)!;
                const b = interventions.find(i => i.id === bid)!;
                if (a.is_emergency && !b.is_emergency) return -1;
                if (!a.is_emergency && b.is_emergency) return 1;
                return a.time.localeCompare(b.time);
            });
        }

        return interventions.map((int) => {
            const client = clients.find(c => c.id === (assets.find(a => a.id === int.asset_id)?.client_id));
            const isWaiting = int.status === 'waiting_approval';
            const isDone = int.status === 'done';
            const pos: [number, number] = (int.latitude && int.longitude) 
              ? [int.latitude, int.longitude] 
              : (JOB_LOCATIONS[int.id] || [48.5830, 7.7480]);
            
            const order = int.tech_id ? techInterventionOrder[int.tech_id]?.indexOf(int.id) + 1 : undefined;

            return (
                <React.Fragment key={`int-group-${int.id}`}>
                    <Marker position={pos} icon={getInterventionIcon(int.status, order, int.tech_id ? getTechColor(int.tech_id) : undefined)}>
                        <Popup className="apple-popup">
                            <div className="p-3 min-w-[200px] ios-card border-none shadow-none">
                                <Badge className={`mb-2 text-[9px] font-black uppercase rounded-full border-none 
                                ${isDone ? 'bg-green-500' : (isWaiting ? 'bg-orange-500 animate-pulse' : 'bg-red-500')} text-white`}>
                                    {isDone ? 'CLÔTURÉE' : (isWaiting ? 'À VALIDER' : 'PLANIFIÉE')} {order ? `• MISSION ${order}` : ''}
                                </Badge>
                                <h3 className="font-black text-foreground text-sm mb-1 leading-tight">{int.address.split(',')[0]}</h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mb-3">{client?.name || 'Client Inconnu'}</p>
                                <div className="pt-3 border-t border-black/5 flex flex-col gap-2">
                                    <Button size="sm" className="h-8 rounded-xl text-[9px] font-black uppercase bg-primary text-white" onClick={() => onSelectIntervention(int)}>Consulter Dossier</Button>
                                    <Button size="sm" className="h-8 rounded-xl text-[9px] font-black uppercase bg-red-500 text-white" onClick={async () => { if (confirm("Supprimer ?")) await deleteIntervention(int.id); }}>Supprimer</Button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                    {!isDone && int.tech_id && routingData[int.id] && (
                       <Polyline 
                            positions={routingData[int.id].geometry} 
                            color={getTechColor(int.tech_id)}
                            weight={isWaiting ? 4 : 3}
                            opacity={isWaiting ? 0.8 : 0.6}
                            dashArray={isWaiting ? "5, 10" : "10, 10"}
                       />
                    )}
                </React.Fragment>
            );
        });
    }, [interventions, routingData, clients, assets, deleteIntervention, onSelectIntervention]);

    const handleVertexDrag = useCallback((techId: string, index: number, newPos: L.LatLng) => {
        const newZones = zones.map(z => {
            if (z.techId !== techId) return z;
            const newPositions = [...z.positions];
            newPositions[index] = { lat: newPos.lat, lng: newPos.lng };
            return { ...z, positions: newPositions };
        });
        updateZones(newZones);
    }, [zones, updateZones]);

    const handleAddVertex = useCallback((techId: string, latlng: L.LatLng, atIndex?: number) => {
        const newZones = zones.map(z => {
            if (z.techId !== techId) return z;
            const newPositions = [...z.positions];
            if (typeof atIndex === 'number') newPositions.splice(atIndex, 0, { lat: latlng.lat, lng: latlng.lng });
            else newPositions.push({ lat: latlng.lat, lng: latlng.lng });
            return { ...z, positions: newPositions };
        });
        updateZones(newZones);
    }, [zones, updateZones]);

    const handleDeleteVertex = useCallback((techId: string, index: number) => {
        const newZones = zones.map(z => {
            if (z.techId !== techId) return z;
            if (z.positions.length <= 3) return z;
            const newPositions = z.positions.filter((_, i) => i !== index);
            return { ...z, positions: newPositions };
        });
        updateZones(newZones);
    }, [zones, updateZones]);

    const memoizedZones = useMemo(() => zones.map((zone) => {
        const polygonPositions = zone.positions.map(p => [p.lat, p.lng] as [number, number]);
        return (
         <React.Fragment key={zone.techId}>
           <Polygon
              positions={polygonPositions}
              pathOptions={{ 
                 color: zone.color, fillColor: zone.color, 
                 fillOpacity: isZoneEditMode ? 0.35 : 0.08, 
                 weight: isZoneEditMode ? 3 : 2, 
                 opacity: 0.8 
              }}
              eventHandlers={{
                click: (e) => {
                    if (!isZoneEditMode) return;
                    
                    const clickPoint = e.latlng;
                    let minDistance = Infinity;
                    let insertIndex = 0;

                    // Find the segment (edge) closest to the click point
                    for (let i = 0; i < zone.positions.length; i++) {
                        const p1 = zone.positions[i];
                        const p2 = zone.positions[(i + 1) % zone.positions.length]; // Wrap around to first point
                        
                        // Calculate distance from point to line segment
                        // Simple approximation using leaflet's distanceTo for endpoints
                        // A true geometric distance to segment is better but this is a quick heuristic
                        // We check the "triangle" height or just distance to midpoint
                        
                        // Let's use distance to the projected point on segment
                        // Or simpler: Index i represents segment p1-p2. We insert at i+1.
                        // We want to minimize (dist(p1, click) + dist(click, p2) - dist(p1, p2))
                        // This value is 0 if click is exactly on the line.
                        
                        const d1 = clickPoint.distanceTo([p1.lat, p1.lng]);
                        const d2 = clickPoint.distanceTo([p2.lat, p2.lng]);
                        const edgeLen = L.latLng([p1.lat, p1.lng]).distanceTo([p2.lat, p2.lng]);
                        
                        const detour = d1 + d2 - edgeLen;
                        
                        if (detour < minDistance) {
                            minDistance = detour;
                            insertIndex = i + 1;
                        }
                    }
                    
                    handleAddVertex(zone.techId, e.latlng, insertIndex);
                }
              }}
           >
              {!isZoneEditMode && <Tooltip sticky direction="center">{zone.name}</Tooltip>}
           </Polygon>
           {isZoneEditMode && zone.positions.map((pos, idx) => (
               <Marker 
                  key={`vertex-${zone.techId}-${idx}`}
                  position={[pos.lat, pos.lng]}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleVertexDrag(zone.techId, idx, e.target.getLatLng()) }}
                  icon={L.divIcon({ className: 'vertex-handle', html: `<div style="background: white; width: 16px; height: 16px; border-radius: 50%; border: 3px solid ${zone.color};"></div>` })}
               />
           ))}
         </React.Fragment>
        );
    }), [zones, isZoneEditMode, handleVertexDrag]);

    if (!map) return null;

    const memoizedProspects = useMemo(() => prospects.map((prospect, idx) => (
        <Marker 
            key={`prospect-${idx}`} 
            position={[parseFloat(prospect.lat), parseFloat(prospect.lon)]}
            icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #5856D6; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(88,86,214,0.4); display: flex; align-items: center; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                            <path d="M9 22v-4h6v4"/>
                            <path d="M8 6h.01"/>
                            <path d="M16 6h.01"/>
                            <path d="M8 10h.01"/>
                            <path d="M16 10h.01"/>
                        </svg>
                    </div>
                </div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
            })}
        >
            <Popup className="apple-popup">
                <div className="p-3 min-w-[220px] ios-card border-none shadow-none text-center">
                    <Badge className="mb-2 bg-indigo-500 text-white border-none text-[8px] font-black uppercase rounded-full px-2">Partenaire Potentiel</Badge>
                    <p className="font-black text-foreground text-[12px] mb-1 leading-tight">{prospect.display_name.split(',')[0]}</p>
                    <Button size="sm" className="w-full h-8 mt-2 rounded-xl bg-indigo-500 text-white text-[9px] font-black uppercase">Appeler l&apos;agence</Button>
                </div>
            </Popup>
        </Marker>
    )), [prospects]);

    const memoizedSuppliers = useMemo(() => suppliers.map((supplier) => {
        const iconColor = supplier.type === 'tools' ? '#FF6B35' : 
                         supplier.type === 'hardware' ? '#4ECDC4' :
                         supplier.type === 'security' ? '#95E1D3' : '#FFA07A';
        
        const storeLogoSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>`;

        return (
            <Marker key={supplier.id} position={[supplier.latitude, supplier.longitude]} icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background: white; width: 42px; height: 42px; border-radius: 12px; border: 2.5px solid ${iconColor}; box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; color: ${iconColor};">${storeLogoSVG}</div>`,
                iconSize: [42, 42],
                iconAnchor: [21, 21]
            })}>
                <Popup className="apple-popup">
                    <div className="p-3 min-w-[200px]">
                        <h3 className="font-black text-xs uppercase mb-1">{supplier.name}</h3>
                        <Badge className="text-[8px] font-black" style={{ backgroundColor: iconColor }}>{supplier.type.toUpperCase()}</Badge>
                        <p className="mt-2 text-[10px] text-muted-foreground font-medium">{supplier.address}</p>
                    </div>
                </Popup>
            </Marker>
        );
    }), [suppliers]);

    const memoizedIncidents = useMemo(() => incidents
        .filter(inc => inc.latitude && inc.longitude)
        .map((incident) => {
            let color = '#333';
            let iconSvg = '';
            let label = 'INCIDENT';

            switch(incident.type) {
                case 'fire':
                    color = '#EF4444'; // Red
                    label = 'INCENDIE';
                    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
                    break;
                case 'burglary':
                    color = '#3B82F6'; // Blue
                    label = 'CAMBRIOLAGE';
                    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
                    break;
                case 'vandalism':
                    color = '#F97316'; // Orange
                    label = 'VANDALISME';
                    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 7 3 3"/><path d="m5 17 3 3"/><path d="m17 5 3 3"/></svg>`;
                    break;
                default:
                    color = '#64748B'; // Slate
                    label = 'SÉCURITÉ';
                    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
            }

            return (
            <Marker 
                key={incident.id} 
                position={[incident.latitude, incident.longitude]}
                icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 100%; height: 100%; background: ${color}; border-radius: 50%; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        <div style="background: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                            ${iconSvg}
                        </div>
                    </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                })}
            >
                <Popup className="apple-popup">
                    <div className="p-3 min-w-[220px] ios-card border-none shadow-none text-center">
                        <Badge className="mb-2 text-white border-none text-[8px] font-black uppercase rounded-full px-2 animate-pulse" style={{ backgroundColor: color }}>{label}</Badge>
                        <p className="font-black text-foreground text-[12px] mb-1 leading-tight">{incident.location}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mb-3">{incident.description}</p>
                        <div className="flex gap-2">
                            <Button size="sm" className="flex-1 h-8 rounded-xl bg-black text-white text-[9px] font-black uppercase">Dépêcher Tech</Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8 rounded-xl text-[9px] font-black uppercase border-black/10">Scanner</Button>
                        </div>
                    </div>
                </Popup>
            </Marker>
            );
        }), [incidents]);

    return (
        <React.Fragment>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {memoizedZones}
            {memoizedInterventions}
            {memoizedProspects}
            {/* {memoizedIncidents} */}
            {memoizedSuppliers}
            {users.filter(u => u.role === 'tech').map((tech) => (
                <TechMarker 
                    key={`tech-${tech.id}`} 
                    tech={tech} 
                    interventions={interventions} 
                    routingData={routingData} 
                    onContactTech={onContactTech}
                    basePos={BASE_POSITIONS[tech.id] || [48.5830, 7.7480]}
                />
            ))}
        </React.Fragment>
    );
};

export default function InteractiveMap({ 
    onSelectIntervention, 
    onContactTech,
    prospects = [],
    incidents = [],
    isZoneEditMode = false 
}: { 
    onSelectIntervention: (int: Intervention) => void, 
    onContactTech?: (techId: string) => void,
    prospects?: Array<{ display_name: string, lat: string, lon: string }>,
    incidents?: SecurityIncident[],
    isZoneEditMode?: boolean
}) {
  useEffect(() => {
    // @ts-expect-error - Leaflet internal
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="h-full w-full bg-secondary/10">
      <MapContainer 
        center={[48.5830, 7.7480]} zoom={14} zoomControl={false}
        attributionControl={false} style={{ height: "100%", width: "100%" }}
      >
        <MapContent 
            onSelectIntervention={onSelectIntervention} 
            onContactTech={onContactTech}
            prospects={prospects}
            incidents={incidents}
            isZoneEditMode={isZoneEditMode}
        />
      </MapContainer>
    </div>
  );
}
