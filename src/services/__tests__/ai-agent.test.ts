import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIDispatchAgent } from '../ai-agent';
import { MOCK_TECHS, MOCK_ZONES, MOCK_SCHEDULES, MOCK_INVENTORY, MOCK_VAN_STOCKS } from '@/tests/fixtures/mock-data';
import { Intervention } from '@/types';

describe('AIDispatchAgent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getSmartDispatch', () => {
    it('should suggest a technician based on territory (Priority 1)', async () => {
      const mission: Partial<Intervention> = {
        category: 'repair',
        address: 'Centre Ville',
        latitude: 48.5850,
        longitude: 7.7400, // Inside tech-1 zone
        is_emergency: false,
      };

      const promise = AIDispatchAgent.getSmartDispatch(
        mission,
        MOCK_TECHS,
        MOCK_VAN_STOCKS,
        MOCK_INVENTORY,
        MOCK_SCHEDULES,
        MOCK_ZONES
      );

      vi.runAllTimers();
      const suggestion = await promise;

      expect(suggestion.techId).toBe('tech-1');
      expect(suggestion.reasoning).toContain('Technicien sectorisé');
    });

    it('should include specialty reasoning for emergencies', async () => {
      const mission: Partial<Intervention> = {
        category: 'Ouverture Fine',
        is_emergency: true,
      };

      const promise = AIDispatchAgent.getSmartDispatch(
        mission,
        MOCK_TECHS,
        MOCK_VAN_STOCKS,
        MOCK_INVENTORY,
        MOCK_SCHEDULES,
        [] // No zones
      );

      vi.runAllTimers();
      const suggestion = await promise;

      // Marc (tech-1) has 'Ouverture Fine' specialty
      expect(suggestion.reasoning).toContain("expertise en Ouverture Fine requise");
    });

    it('should return a high optimization score', async () => {
      const mission: Partial<Intervention> = {
        category: 'repair',
      };

      const promise = AIDispatchAgent.getSmartDispatch(
        mission,
        MOCK_TECHS,
        MOCK_VAN_STOCKS,
        MOCK_INVENTORY,
        MOCK_SCHEDULES,
        []
      );

      vi.runAllTimers();
      const suggestion = await promise;

      expect(suggestion.optimizationScore).toBeGreaterThanOrEqual(85);
      expect(suggestion.optimizationScore).toBeLessThanOrEqual(100);
    });
  });
});
