
/**
 * Geometric utilities for Territory Management
 */

interface Point {
    lat: number;
    lng: number;
}

/**
 * Ray-casting algorithm to check if a point is inside a polygon
 */
export const isPointInPolygon = (point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]): boolean => {
    const x = point.lat;
    const y = point.lng;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

/**
 * Finds the technician assigned to a specific geographical zone
 */
export const findTechForLocation = (lat: number, lng: number, zones: any[]): string | null => {
    for (const zone of zones) {
        if (isPointInPolygon({ lat, lng }, zone.positions)) {
            return zone.techId;
        }
    }
    return null;
};
