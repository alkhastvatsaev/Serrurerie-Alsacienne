import { User, Zone, WorkSchedule, InventoryItem, VanStock } from "@/types";

export const MOCK_TECHS: User[] = [
  { id: 'tech-1', name: 'Marc', role: 'tech', status: 'active', specialties: ['Ouverture Fine', 'A2P***'], performance_score: 98 },
  { id: 'tech-2', name: 'Sophie', role: 'tech', status: 'active', specialties: ['Contrôle d\'Accès', 'Électronique'], performance_score: 95 },
  { id: 'tech-3', name: 'Lucas', role: 'tech', status: 'active', specialties: ['Blindage', 'Soudure'], performance_score: 92 },
];

export const MOCK_ZONES: Zone[] = [
  {
    techId: 'tech-1',
    name: 'Zone Centre',
    color: '#007AFF',
    positions: [
      { lat: 48.5800, lng: 7.7300 },
      { lat: 48.5920, lng: 7.7350 },
      { lat: 48.5920, lng: 7.7600 },
      { lat: 48.5800, lng: 7.7600 },
    ]
  },
];

export const MOCK_SCHEDULES: WorkSchedule[] = [
  { id: 's1', tech_id: 'tech-1', date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '18:00', type: 'working' },
  { id: 's2', tech_id: 'tech-2', date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '18:00', type: 'working' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', item_name: 'Cylindre Mul-T-Lock MT5+', quantity: 24, price: 185, min_threshold: 8 },
];

export const MOCK_VAN_STOCKS: VanStock[] = [
  { tech_id: 'tech-1', item_id: 'i1', quantity: 4 },
];
