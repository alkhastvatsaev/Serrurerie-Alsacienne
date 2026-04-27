import { describe, it, expect, vi } from 'vitest';
import { NewsSentinel } from '../news-sentinel';

describe('NewsSentinel', () => {
  describe('getLocksmithAngle', () => {
    it('should identify fire in apartment as cylinder replacement opportunity', () => {
      const angle = NewsSentinel.getLocksmithAngle('fire', 'Feu d\'appartement au 3ème étage.');
      expect(angle).toContain('Remplacement cylindres');
    });

    it('should identify burglary attempt as door reinforcement opportunity', () => {
      const angle = NewsSentinel.getLocksmithAngle('burglary', 'Tentative de cambriolage rue de la Krutenau.');
      expect(angle).toContain('Renforcement porte');
      expect(angle).toContain('A2P***');
    });

    it('should identify vandalism on shop window as temporary boarding opportunity', () => {
      const angle = NewsSentinel.getLocksmithAngle('vandalism', 'Vitrine brisée par des vandales.');
      expect(angle).toContain('Fermeture provisoire');
    });

    it('should handle unknown types with a fallback', () => {
      const angle = NewsSentinel.getLocksmithAngle('unknown' as any, 'Random event');
      expect(angle).toBe('Veille stratégique.');
    });
  });

  describe('fetchRealEvents', () => {
    it('should fetch and format events from the API', async () => {
      const mockNews = [
        {
          id: '1',
          type: 'burglary',
          location: 'Bruxelles',
          description: 'Cambriolage en cours',
          timestamp: new Date().toISOString(),
          latitude: 50.85,
          longitude: 4.35,
          url: 'http://example.com',
          metadata: { priority: 'high' }
        }
      ];

      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockNews,
      } as Response);

      const events = await NewsSentinel.fetchRealEvents();
      
      expect(events).toHaveLength(1);
      expect(events[0].urgency).toBe('high');
      expect(events[0].locksmithAngle).toContain('Mise en sécurité');
    });
  });
});
