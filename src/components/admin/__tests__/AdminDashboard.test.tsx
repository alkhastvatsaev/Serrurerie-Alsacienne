import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminDashboard } from '../AdminDashboard';
import { AIDispatchAgent } from '@/services/ai-agent';
import { Mock } from 'vitest';

// Mock dynamic import
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-map">Mock Map</div>,
}));

// Mock AIDispatchAgent
vi.mock('@/services/ai-agent', () => ({
  AIDispatchAgent: {
    getSmartDispatch: vi.fn(),
  },
  SecurityScanningAgent: {
    getLiveIncidents: vi.fn(),
  },
}));

// Mock useStore
const mockStore = {
  inventory: [],
  assets: [],
  interventions: [],
  users: [
    { id: '1', name: 'TIMOUR', role: 'admin' },
    { id: '2', name: 'Marc', role: 'tech' },
  ],
  messages: [],
  currentUser: { id: '1', name: 'TIMOUR', role: 'admin' },
  vanStocks: [],
  notifications: [],
  zones: [],
  securityIncidents: [],
  activeCalls: [],
  clients: [],
  schedules: [],
  setCurrentUser: vi.fn(),
  addNotification: vi.fn(),
  updateIntervention: vi.fn(),
  setProfileClient: vi.fn(),
  initSentinel: vi.fn(),
};

vi.mock('@/store/useStore', () => ({
  useStore: () => mockStore,
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with core elements', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/Actions Manager/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  it('opens the create mission modal and triggers AI suggestion', async () => {
    // Setup mock for AIDispatchAgent.getSmartDispatch
    const mockSuggestion = {
      techId: '2',
      reasoning: 'Proximité immédiate et stock disponible.',
      urgencyScore: 90,
    };
    (AIDispatchAgent.getSmartDispatch as Mock).mockResolvedValue(mockSuggestion);

    render(<AdminDashboard />);
    
    const plusButton = screen.getByRole('button', { name: /Nouvelle Intervention/i });
    fireEvent.click(plusButton);
    
    // Check if modal appears
    expect(screen.getByText(/Créer Mission/i)).toBeInTheDocument();

    // Trigger AI Dispatch
    const aiButton = screen.getByText(/Dispatch IA/i);
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(AIDispatchAgent.getSmartDispatch).toHaveBeenCalled();
    });

    // Check if suggestion reasoning appears
    await waitFor(() => {
      expect(screen.getByText(/Proximité immédiate/i)).toBeInTheDocument();
    });
  });
});
