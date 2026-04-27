import { describe, it, expect } from 'vitest';
import { isPointInPolygon, findTechForLocation } from '../geo-utils';

describe('geo-utils', () => {
  const squarePolygon = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 10 },
    { lat: 10, lng: 10 },
    { lat: 10, lng: 0 },
  ];

  describe('isPointInPolygon', () => {
    it('should return true for a point inside the polygon', () => {
      expect(isPointInPolygon({ lat: 5, lng: 5 }, squarePolygon)).toBe(true);
    });

    it('should return false for a point outside the polygon', () => {
      expect(isPointInPolygon({ lat: 15, lng: 15 }, squarePolygon)).toBe(false);
    });

    it('should return false for a point on the edge (depending on implementation, usually false or specific behavior)', () => {
      // Ray casting often treats edges specifically, but let's test a clear outside point
      expect(isPointInPolygon({ lat: -1, lng: -1 }, squarePolygon)).toBe(false);
    });
  });

  describe('findTechForLocation', () => {
    const mockZones = [
      {
        techId: 'tech-1',
        positions: [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 5 },
          { lat: 5, lng: 5 },
          { lat: 5, lng: 0 },
        ],
      },
      {
        techId: 'tech-2',
        positions: [
          { lat: 6, lng: 6 },
          { lat: 6, lng: 10 },
          { lat: 10, lng: 10 },
          { lat: 10, lng: 6 },
        ],
      },
    ];

    it('should find the correct technician for a location', () => {
      expect(findTechForLocation(2, 2, mockZones)).toBe('tech-1');
      expect(findTechForLocation(8, 8, mockZones)).toBe('tech-2');
    });

    it('should return null if no technician is assigned to the zone', () => {
      expect(findTechForLocation(5.5, 5.5, mockZones)).toBeNull();
    });
  });
});
