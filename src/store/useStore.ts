
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User, Client, Asset, InventoryItem, Intervention, VanStock, Supplier, Notification, WorkSchedule, Zone, ZonePosition, ActivityItem } from '@/types';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";


import { SentinelEvent } from "@/services/news-sentinel";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  timestamp: string | { toDate?: () => Date } | null;
}

interface ActiveCall {
  id: string;
  phoneNumber: string;
  clientId: string | null;
  clientName: string;
  timestamp: any;
  status: 'ringing' | 'accepted' | 'missed';
}

interface AppState {
  users: User[];
  clients: Client[];
  assets: Asset[];
  inventory: InventoryItem[];
  interventions: Intervention[];
  vanStocks: VanStock[];
  schedules: WorkSchedule[];
  messages: Message[];
  currentUser: User | null;
  currentProfileClient: Client | null; // For the CRM auto-popup/view
  zones: Zone[];
  suppliers: Supplier[];
  notifications: Notification[];
  securityIncidents: SentinelEvent[];
  activeCalls: ActiveCall[];
  
  addSecurityIncident: (incident: SentinelEvent) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsAsRead: () => void;
  
  uploadImage: (file: File | Blob, path: string) => Promise<string>;
  setCurrentUser: (user: User | null) => void;
  setProfileClient: (client: Client | null) => void;
  updateIntervention: (id: string, updates: Partial<Intervention>) => void;
  deleteIntervention: (id: string) => Promise<void>;
  decrementStock: (itemId: string, quantity: number) => void;
  addIntervention: (intervention: Intervention) => void;
  addClientActivity: (clientId: string, activity: Partial<ActivityItem> & { type: ActivityItem['type'], title: string, description: string }) => Promise<void>;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  updateZones: (zones: Zone[]) => void;
  updateSchedule: (id: string, updates: Partial<WorkSchedule>) => void;
  addSchedule: (schedule: Omit<WorkSchedule, 'id'>) => void;
  
  transferVanStock: (fromTechId: string, toTechId: string, itemId: string, quantity: number) => void;
  simulateClientTracking: (interventionId: string) => void;
  // Real-time Sync
  initListeners: () => void;
  seedData: () => void;
  checkSmartDispatch: (intervention: Intervention) => void;
  // Sentinel
  initSentinel: () => void;
  addClient: (client: Omit<Client, 'id'>) => Promise<string | undefined>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  dismissCall: (callId: string) => Promise<void>;
}

// Helper: Check if point is in polygon (Ray Casting)
function isPointInPolygon(point: {lat: number, lng: number}, polygon: {lat: number, lng: number}[]) {
    let x = point.lat, y = point.lng;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].lat, yi = polygon[i].lng;
        let xj = polygon[j].lat, yj = polygon[j].lng;
        
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

const DUMMY_SCHEDULES: WorkSchedule[] = [
  // Marc
  { id: 's1', tech_id: '2', date: '2026-02-09', start_time: '08:00', end_time: '18:00', type: 'working' },
  { id: 's2', tech_id: '2', date: '2026-02-10', start_time: '08:00', end_time: '18:00', type: 'working' },
  { id: 's3', tech_id: '2', date: '2026-02-11', start_time: '08:00', end_time: '18:00', type: 'working' },
  { id: 's3b', tech_id: '2', date: '2026-02-12', start_time: '08:00', end_time: '18:00', type: 'working' },
  { id: 's3c', tech_id: '2', date: '2026-02-13', start_time: '08:00', end_time: '18:00', type: 'working' },
  // Sophie
  { id: 's4', tech_id: '3', date: '2026-02-09', start_time: '14:00', end_time: '22:00', type: 'working' },
  { id: 's5', tech_id: '3', date: '2026-02-10', start_time: '14:00', end_time: '22:00', type: 'working' },
  { id: 's5b', tech_id: '3', date: '2026-02-11', start_time: '14:00', end_time: '22:00', type: 'working' },
  { id: 's5c', tech_id: '3', date: '2026-02-14', start_time: '10:00', end_time: '19:00', type: 'working' },
  // Hugo (On call)
  { id: 's6', tech_id: '5', date: '2026-02-09', start_time: '20:00', end_time: '06:00', type: 'on_call' },
  { id: 's6b', tech_id: '5', date: '2026-02-10', start_time: '20:00', end_time: '06:00', type: 'on_call' },
  { id: 's6c', tech_id: '5', date: '2026-02-11', start_time: '20:00', end_time: '06:00', type: 'on_call' },
  // Lucas
  { id: 's7', tech_id: '4', date: '2026-02-09', start_time: '08:00', end_time: '17:00', type: 'working' },
  { id: 's8', tech_id: '4', date: '2026-02-10', start_time: '08:00', end_time: '17:00', type: 'working' },
  { id: 's9', tech_id: '4', date: '2026-02-11', start_time: '08:00', end_time: '17:00', type: 'working' },
  { id: 's10', tech_id: '4', date: '2026-02-12', start_time: '08:00', end_time: '17:00', type: 'working' },
  // Yanis
  { id: 's11', tech_id: '6', date: '2026-02-09', start_time: '09:00', end_time: '18:00', type: 'working' },
  { id: 's12', tech_id: '6', date: '2026-02-10', start_time: '09:00', end_time: '18:00', type: 'working' },
  { id: 's13', tech_id: '6', date: '2026-02-13', start_time: '09:00', end_time: '18:00', type: 'working' },
];

const DUMMY_USERS: User[] = [
  { id: '1', name: 'TIMOUR', role: 'admin', status: 'active', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', phone: '+32 470 00 00 00', email: 'admin@serrurerie-belgique.be' },
  { id: '2', name: 'Marc', role: 'tech', status: 'active', avatar_url: '/avatars/marc.png', phone: '+32 471 11 22 33', email: 'marc@serrurerie-belgique.be', specialties: ['Ouverture Fine', 'Haute Sécurité', 'Coffre-fort'], performance_score: 98, completed_missions: 1240 },
  { id: '3', name: 'Sophie', role: 'tech', status: 'active', avatar_url: '/avatars/sophie.png', phone: '+32 472 22 33 44', email: 'sophie@serrurerie-belgique.be', specialties: ['Contrôle d\'Accès', 'Électronique', 'Nuki Pro'], performance_score: 95, completed_missions: 856 },
  { id: '4', name: 'Lucas', role: 'tech', status: 'active', avatar_url: '/avatars/lucas.png', phone: '+32 473 33 44 55', email: 'lucas@serrurerie-belgique.be', specialties: ['Blindage', 'Portes de Cave', 'Soudure'], performance_score: 92, completed_missions: 1120 },
  { id: '5', name: 'Hugo', role: 'tech', status: 'active', avatar_url: '/avatars/hugo.png', phone: '+32 474 44 55 66', email: 'hugo@serrurerie-belgique.be', specialties: ['Automobile', 'Transpondeur', 'OBDII'], performance_score: 89, completed_missions: 645 },
  { id: '6', name: 'Yanis', role: 'tech', status: 'active', avatar_url: '/avatars/yanis.png', phone: '+32 475 55 66 77', email: 'yanis@serrurerie-belgique.be', specialties: ['Maintenance Gérance', 'Vigik', 'Multimarques'], performance_score: 94, completed_missions: 932 },
  { id: '7', name: 'Thomas', role: 'tech', status: 'active', avatar_url: '/avatars/thomas.png', phone: '+32 476 66 77 88', email: 'thomas@serrurerie-belgique.be', specialties: ['Domotique', 'Volets Roulants', 'Serrurerie Traditionnelle'], performance_score: 88, completed_missions: 420 },
]

const DUMMY_CLIENTS: Client[] = [
  { id: 'c1', name: 'Résidence Louise', address: 'Avenue Louise 120, 1050 Bruxelles', contact_info: '+32 2 511 22 33' },
  { id: 'c2', name: 'Bureaux de la Bourse', address: 'Place de la Bourse 1, 1000 Bruxelles', contact_info: '+32 2 444 55 66' },
  { id: 'user-test', name: 'Alkhast Vatsaev', address: 'Rue de la Loi 16, 1000 Bruxelles', phone: '+32 470 00 00 00', email: 'alkhastvatsaev@gmail.com', contact_info: '+32 470 00 00 00' },
];

const DUMMY_ASSETS: Asset[] = [
  { 
    id: 'a1', 
    client_id: 'c1', 
    qr_code_id: 'PRT-001', 
    description: 'Porte Entrée Principale',
    specifications: {
      brand: 'Vachette',
      cylinder_size: '30x40',
      shielding_type: 'A2P*',
    },
    last_service_date: '2023-10-15'
  },
  { 
    id: 'a2', 
    client_id: 'c2', 
    qr_code_id: 'PRT-002', 
    description: 'Porte de Service',
    specifications: {
      brand: 'Fichet',
      cylinder_size: '40x40',
      shielding_type: 'Standard',
    },
    last_service_date: '2024-01-20'
  }
];

const DUMMY_INVENTORY: InventoryItem[] = [
  // Cylindres & Serrures
  // --- HIGH-SECURITY & SMART (GLOBAL STANDARDS) ---
  { id: 'i1', item_name: 'Cylindre Mul-T-Lock MT5+ (Anti-Extraction)', quantity: 24, price: 185, min_threshold: 8 },
  { id: 'i2', item_name: 'Cylindre EVVA MCS (Magnétique Haute Sécurité)', quantity: 12, price: 290, min_threshold: 6 },
  { id: 'i3', item_name: 'Serrure Connectée Yale Linus Pro', quantity: 15, price: 249, min_threshold: 5 },
  { id: 'i4', item_name: 'Serrure Fichet Multipoint A2P***', quantity: 8, price: 650, min_threshold: 2 },
  { id: 'i5', item_name: 'Lecteur Biométrique Allegion Schlage', quantity: 6, price: 420, min_threshold: 2 },
  
  // --- CAR KEYS & TRANSPONDERS (AUTOMOTIVE) ---
  { id: 'i16', item_name: 'Clé Vierge Transponder (Universelle)', quantity: 50, price: 45, min_threshold: 15 },
  { id: 'i17', item_name: 'Smart Fob Pro (Programmation BMW/Audi)', quantity: 20, price: 120, min_threshold: 5 },
  { id: 'i18', item_name: 'Kit OBDII Advanced Diagnostics', quantity: 5, price: 850, min_threshold: 1 },
  
  // --- SAFE & VAULT SERVICES ---
  { id: 'i19', item_name: 'Serrure Électronique de Coffre-Fort (La Gard)', quantity: 10, price: 180, min_threshold: 3 },
  { id: 'i20', item_name: 'Plaque de Blindage Anti-Perçage (Manganèse)', quantity: 15, price: 95, min_threshold: 5 },

  // --- TOOLS & CONSUMABLES ---
  { id: 'i9', item_name: 'Extracteur de cylindre dormakaba Pro', quantity: 4, price: 380, min_threshold: 1 },
  { id: 'i10', item_name: 'Perceuse Bosch Pro GSB 18V-150C (Élite)', quantity: 6, price: 345, min_threshold: 2 },
  { id: 'i13', item_name: 'Lube Pro High-Performance (Silicone Graphite)', quantity: 48, price: 18, min_threshold: 12 },
];

const DUMMY_VAN_STOCKS: VanStock[] = [
  // Marc (Bruxelles Centre)
  { tech_id: '2', item_id: 'i1', quantity: 4 },
  { tech_id: '2', item_id: 'i3', quantity: 1 },
  { tech_id: '2', item_id: 'i10', quantity: 1 },
  { tech_id: '2', item_id: 'i13', quantity: 6 },
  
  // Sophie (Anvers)
  { tech_id: '3', item_id: 'i1', quantity: 3 },
  { tech_id: '3', item_id: 'i2', quantity: 4 },
  { tech_id: '3', item_id: 'i6', quantity: 2 },
  { tech_id: '3', item_id: 'i13', quantity: 3 },
  
  // Lucas (Namur)
  { tech_id: '4', item_id: 'i1', quantity: 2 },
  { tech_id: '4', item_id: 'i4', quantity: 5 },
  { tech_id: '4', item_id: 'i11', quantity: 2 },
  { tech_id: '4', item_id: 'i14', quantity: 1 },

  // Hugo (Schaerbeek)
  { tech_id: '5', item_id: 'i2', quantity: 6 },
  { tech_id: '5', item_id: 'i5', quantity: 1 },
  { tech_id: '5', item_id: 'i10', quantity: 1 },
  { tech_id: '5', item_id: 'i13', quantity: 8 },

  // Yanis (Ixelles)
  { tech_id: '6', item_id: 'i1', quantity: 5 },
  { tech_id: '6', item_id: 'i6', quantity: 2 },
  { tech_id: '6', item_id: 'i12', quantity: 1 },
  { tech_id: '6', item_id: 'i15', quantity: 4 },

  // Thomas (Uccle)
  { tech_id: '7', item_id: 'i1', quantity: 4 },
  { tech_id: '7', item_id: 'i4', quantity: 2 },
  { tech_id: '7', item_id: 'i10', quantity: 1 },
];

const DEFAULT_ZONES: Zone[] = [
  {
    techId: '2', 
    name: 'Zone Bruxelles Centre (Marc)',
    color: '#007AFF', 
    positions: [
      {lat: 50.8400, lng: 4.3400}, {lat: 50.8600, lng: 4.3400}, {lat: 50.8600, lng: 4.3700}, 
      {lat: 50.8450, lng: 4.3800}, {lat: 50.8350, lng: 4.3700}, {lat: 50.8320, lng: 4.3500}
    ]
  },
  {
    techId: '3', 
    name: 'Zone Anvers (Sophie)',
    color: '#FF9500', 
    positions: [
      {lat: 51.2100, lng: 4.3900}, {lat: 51.2300, lng: 4.3900}, {lat: 51.2300, lng: 4.4200}, 
      {lat: 51.2100, lng: 4.4200}
    ]
  },
  {
    techId: '4', 
    name: 'Zone Namur (Lucas)',
    color: '#34C759', 
    positions: [
      {lat: 50.4600, lng: 4.8500}, {lat: 50.4800, lng: 4.8500}, {lat: 50.4800, lng: 4.8800}, 
      {lat: 50.4600, lng: 4.8800}
    ]
  }
];

// Locksmith Suppliers in Belgium
const SUPPLIERS: Supplier[] = [
  {
    id: 'sup1',
    name: 'Lecot Bruxelles',
    type: 'tools',
    address: 'Boulevard de l\'Humanité 55, 1070 Anderlecht',
    latitude: 50.8200,
    longitude: 4.3100,
    phone: '+32 2 520 20 20',
    hours: 'Lun-Ven: 7h-18h',
    specialties: ['Extracteurs de cylindre', 'Quincaillerie pro'],
    logo_url: 'https://www.lecot.be/images/logo.png'
  },
  {
    id: 'sup2',
    name: 'Meno Group',
    type: 'hardware',
    address: 'Chaussée de Louvain, 1930 Zaventem',
    latitude: 50.8800,
    longitude: 4.4700,
    phone: '+32 2 725 15 00',
    hours: 'Lun-Ven: 8h-18h',
    specialties: ['Blindage A2P', 'Serrures multipoints'],
    logo_url: 'https://www.meno.be/logo.png'
  }
];

// Safe Storage Wrapper for Mobile Compatibility
const createSafeStorage = (): StateStorage => {
  // In-memory fallback
  const memoryStorage = new Map<string, string>();
  
  // Test if localStorage is available and working
  const isLocalStorageAvailable = (() => {
    try {
      const testKey = '__zustand_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('localStorage not available, using in-memory storage');
      return false;
    }
  })();

  return {
    getItem: (name: string): string | null => {
      if (isLocalStorageAvailable) {
        try {
          return localStorage.getItem(name);
        } catch (error) {
          console.error('localStorage.getItem error:', error);
          return memoryStorage.get(name) || null;
        }
      }
      return memoryStorage.get(name) || null;
    },
    setItem: (name: string, value: string): void => {
      if (isLocalStorageAvailable) {
        try {
          localStorage.setItem(name, value);
          return;
        } catch (error) {
          // Quota exceeded or other error - fallback to memory
          console.error('localStorage.setItem error:', error);
        }
      }
      memoryStorage.set(name, value);
    },
    removeItem: (name: string): void => {
      if (isLocalStorageAvailable) {
        try {
          localStorage.removeItem(name);
        } catch (error) {
          console.error('localStorage.removeItem error:', error);
        }
      }
      memoryStorage.delete(name);
    },
  };
};

export const useStore = create<AppState>()((set, get) => ({
  users: DUMMY_USERS,
  clients: DUMMY_CLIENTS,
  assets: DUMMY_ASSETS,
  inventory: DUMMY_INVENTORY,
  interventions: [],
  vanStocks: DUMMY_VAN_STOCKS,
  schedules: DUMMY_SCHEDULES,
  messages: [],
  currentUser: null, // No default user, forces login
  currentProfileClient: null,
  activeCalls: [],
  zones: DEFAULT_ZONES,
  suppliers: SUPPLIERS,
  notifications: [
    { id: '1', type: 'info', title: 'Standards Mondiaux Actifs', message: 'Catalogue services aligné sur Yale, Allegion & dormakaba.', timestamp: new Date().toLocaleTimeString(), read: false },
    { id: '2', type: 'success', title: 'Automobile Pro', message: 'Nouveaux kits OBDII de programmation BMW/Audi disponibles en stock central.', timestamp: new Date().toLocaleTimeString(), read: false }
  ],

  addNotification: (notif) => set((state) => ({
    notifications: [
      { 
        ...notif, 
        id: Math.random().toString(36).substr(2, 9), 
        timestamp: new Date().toLocaleTimeString(), 
        read: false 
      }, 
      ...state.notifications 
    ].slice(0, 50) // Keep last 50
  })),

  markNotificationsAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  dismissCall: async (callId: string) => {
    try {
        const { db } = await import('@/lib/firebase');
        const { doc, updateDoc, deleteDoc } = await import('firebase/firestore');
        const callRef = doc(db, 'active_calls', callId);
        await updateDoc(callRef, { status: 'missed' });
        // Optionally delete it to be clean
        setTimeout(async () => {
            try {
              await deleteDoc(callRef);
            } catch(e) {}
        }, 5000);
    } catch (e) {
        console.error("Error dismissing call:", e);
    }
  },

      uploadImage: async (file, path) => {
        try {
          // Fallback if we are in a demo mode or disconnected
          const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
          if (!isFirebaseConfigured) {
              console.warn("Firebase not configured, skipping real upload.");
              return "";
          }

          const { storage } = await import('@/lib/firebase');
          const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const storageRef = ref(storage, path);
          
          // Safety timeout for upload
          const uploadPromise = uploadBytes(storageRef, file);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
          
          await Promise.race([uploadPromise, timeoutPromise]);
          return await getDownloadURL(storageRef);
        } catch (e) {
          console.error("Upload failed or timed out:", e);
          return ""; 
        }
      },

      setCurrentUser: (user) => set({ currentUser: user }),
  setProfileClient: (client) => set({ currentProfileClient: client }),
  
  addClientActivity: async (clientId, activity) => {
    const timestamp = activity.timestamp || new Date().toISOString();
    const newActivity: ActivityItem = {
      ...activity,
      id: activity.id || Math.random().toString(36).substr(2, 9),
      timestamp
    };
    
    try {
      const activityRef = doc(db, 'clients', clientId, 'activities', newActivity.id);
      await setDoc(activityRef, newActivity);
      
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, { 
        last_contact_date: timestamp
      });
    } catch (e) {
      console.error("Error adding client activity:", e);
    }
  },

      updateSchedule: (id, updates) => set((state) => {
        const newSchedules = state.schedules.map(s => s.id === id ? { ...s, ...updates } : s);
        // Add notification for the tech
        const schedule = newSchedules.find(s => s.id === id);
        if (schedule) {
          const tech = state.users.find(u => u.id === schedule.tech_id);
          if (tech) {
            state.addNotification({
              type: 'tech',
              title: 'Planning Mis à Jour',
              message: `Votre planning pour le ${schedule.date} a été modifié.`
            });
          }
        }
        return { schedules: newSchedules };
      }),

      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, { ...schedule, id: Math.random().toString(36).substr(2, 9) }]
      })),
      
      initListeners: () => {
        if (!auth || !db) return;

        // 0. Listen for Auth Changes
        const { onAuthStateChanged } = require('firebase/auth');
        onAuthStateChanged(auth, (firebaseUser: any) => {
          if (firebaseUser) {
            // Find internal user by phone or email
            const internalUser = get().users.find(u => 
              u.phone?.replace(/\s/g, '') === firebaseUser.phoneNumber?.replace(/\s/g, '').replace('+33', '0') ||
              u.email === firebaseUser.email
            );
            if (internalUser) {
              set({ currentUser: internalUser });
            }
          } else {
            set({ currentUser: null });
          }
        });

        // 1. Listen for Interventions - With Error Handling
        try {
            onSnapshot(collection(db, 'interventions'), (snapshot) => {
            const interventions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Intervention));
            set({ interventions });
            }, (error) => {
                console.error("Interventions listener error:", error);
            });
        } catch (e) { console.error("Could not init int listener", e); }

        // Special listener for active calls (CRM auto-popup)
        try {
          onSnapshot(query(collection(db, 'active_calls'), orderBy('timestamp', 'desc')), (snapshot) => {
            const now = Date.now();
            const calls = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as ActiveCall))
              .filter(call => {
                if (!call.timestamp) return true; // Keep calls that just arrived (timestamp pending)
                const callTime = typeof call.timestamp === 'number' 
                  ? call.timestamp 
                  : (call.timestamp?.toMillis ? call.timestamp.toMillis() : now);
                return (now - callTime) < 300000; 
              });

            set({ activeCalls: calls });
            
            // Only trigger notification, do not force open profile anymore (requested by user)
            const latestCall = calls[0];
            if (latestCall && latestCall.status === 'ringing') {
              if (typeof window !== 'undefined') {
                const lastNotifiedCallId = (window as any)._lastNotifiedCallId;
                if (lastNotifiedCallId !== latestCall.id) {
                  (window as any)._lastNotifiedCallId = latestCall.id;
                  
                  get().addNotification({
                    type: 'tech',
                    title: '📞 Appel Entrant',
                    message: `${latestCall.clientName || 'Inconnu'} (${latestCall.phoneNumber})`
                  });

                  // Log activity in history if client is recognized
                  if (latestCall.clientId) {
                    get().addClientActivity(latestCall.clientId, {
                      type: 'call',
                      title: 'Appel Entrant Reçu',
                      description: `Le client a appelé à ${new Date().toLocaleTimeString('fr-FR')}.`,
                      metadata: { direction: 'inbound' }
                    } as any);
                  } else if (latestCall.phoneNumber) {
                    // Try to find if client exists by phone (even if clientId not set on call doc)
                    const cleanCallPhone = latestCall.phoneNumber.replace(/[\s\.\-\(\)]/g, '');
                    const existingClient = get().clients.find(c => {
                        const cleanCPhone = (c.phone || c.contact_info || '').replace(/[\s\.\-\(\)]/g, '');
                        return cleanCPhone.length > 5 && cleanCPhone.includes(cleanCallPhone);
                    });
                    
                    if (existingClient) {
                      get().addClientActivity(existingClient.id, {
                        type: 'call',
                        title: 'Appel Entrant Reçu',
                        description: `Le client a appelé à ${new Date().toLocaleTimeString('fr-FR')}.`,
                        metadata: { direction: 'inbound' }
                      } as any);
                    } else {
                      // Automatiquement créer un nouveau prospect pour garder une trace
                      get().addClient({
                        name: `🆕 Nouveau (Appel ${latestCall.phoneNumber})`,
                        phone: latestCall.phoneNumber,
                        contact_info: latestCall.phoneNumber,
                        address: 'Adresse à renseigner'
                      }).then(newId => {
                        if (newId) {
                           get().addClientActivity(newId, {
                             type: 'call',
                             title: 'Premier Appel (Nouveau Prospect)',
                             description: `Premier contact détecté via appel à ${new Date().toLocaleTimeString('fr-FR')}. Fiche créée automatiquement.`,
                             metadata: { direction: 'inbound' }
                           } as any);
                        }
                      });
                    }
                  }
                }
              }
            }
          });
        } catch (e) { console.error("Could not init active calls listener", e); }

        // 2. Listen for Messages
        try {
            const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
            onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()
            } as Message));
            set({ messages });
            }, (error) => {
                console.error("Messages listener error:", error);
            });
        } catch (e) { console.error("Could not init msg listener", e); }

        // 3. Listen for Users (Team)
        try {
            onSnapshot(collection(db, 'users'), (snapshot) => {
                const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
                // Remove potential duplicates if cleaning is needed, but unique doc IDs are enough to satisfy React keys
                set({ users });
            });
        } catch (e) { console.error("Users listener error:", e); }

        // 4. Listen for Inventory & Assets
        try {
            onSnapshot(collection(db, 'inventory'), (snapshot) => {
                const inventory = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryItem));
                set({ inventory });
            });
            onSnapshot(collection(db, 'assets'), (snapshot) => {
                const assets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
                set({ assets });
            });
        } catch (e) { console.error("Inventory/Assets listener error:", e); }

        // 5. Listen for Schedules (Smart HR Alert)
        try {
            onSnapshot(collection(db, 'schedules'), (snapshot) => {
                const schedules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkSchedule));
                set({ schedules });
                
                // Smart HR Logic: Detect Understaffing
                const today = new Date().toISOString().split('T')[0];
                const techsWorkingToday = schedules.filter(s => s.date === today && s.type === 'working');
                
                // If fewer than 2 techs active (arbitrary rule for demo)
                if (techsWorkingToday.length < 2 && get().currentUser?.role === 'admin') {
                    // Check if we already alerted today to avoid spam (simple check)
                    const alreadyAlerted = get().notifications.some(n => n.title === 'Alerte Planning RH' && n.timestamp?.startsWith("Aujourd'hui"));
                    
                    if (!alreadyAlerted) {
                        const backupTech = get().users.find(u => !techsWorkingToday.some(t => t.tech_id === u.id) && u.role === 'tech');
                        
                        get().addNotification({
                            type: 'stock', // Use red alert style
                            title: 'Alerte Planning RH',
                            message: `Manque d'effectif détecté aujourd'hui (${techsWorkingToday.length} actifs). Suggestion : Rappeler ${backupTech?.name || 'un astreinte'} en renfort.`
                        });
                    }
                }
            });
        } catch (e) { console.error("Schedule listener error:", e); }

        // 5. Listen for Zones - Real-time sync across devices
        try {
            const zonesDocRef = doc(db, 'settings', 'zones');
            onSnapshot(zonesDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    if (data?.zones) {
                        const existingZones = data.zones as Zone[];
                        // Check if we need to add missing default zones (e.g. for new techs)
                        const missingZones = DEFAULT_ZONES.filter(dz => !existingZones.some(ez => ez.techId === dz.techId));
                        
                        if (missingZones.length > 0) {
                            const updatedZones = [...existingZones, ...missingZones];
                            set({ zones: updatedZones });
                            // Update Firestore to include missing zones
                            updateDoc(zonesDocRef, { zones: updatedZones }).catch(e => console.error("Error updating missing zones:", e));
                        } else {
                            set({ zones: existingZones });
                        }
                    }
                } else {
                    // Initialize zones in Firebase if not exists
                    setDoc(zonesDocRef, { zones: DEFAULT_ZONES }).catch(e => 
                        console.error("Error initializing zones:", e)
                    );
                }
            }, (error) => {
                console.error("Zones listener error:", error);
            });
        } catch (e) { console.error("Could not init zones listener", e); }

        // 4. Live Business Intelligence Triggers
        // These would normally be server-side but for this demo we'll trigger them on client changes
        const currentStore = get();
        
        // Listen for stock changes
        const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
              const data = change.doc.data();
              if (data.quantity < data.min_threshold) {
                get().addNotification({
                  type: 'stock',
                  title: 'Alerte Stock Bas',
                  message: `Attention: ${data.item_name} est presque épuisé (${data.quantity} restants).`
                });
              }
            }
          });
        });

        // Listen for new interventions or status updates
        const unsubInterventions = onSnapshot(collection(db, 'interventions'), (snapshot) => {
          snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            if (change.type === 'added' && data.status === 'pending') {
               get().addNotification({
                 type: 'tech',
                 title: 'Nouvelle Mission',
                 message: `Assigné à ${DUMMY_USERS.find(u => u.id === data.tech_id)?.name || 'Technicien'} : ${data.address}`
               });
               
               // SMART DISPATCH: Active only for Admin to act as "Brain"
               if (get().currentUser?.role === 'admin') {
                  get().checkSmartDispatch(data as Intervention);
               }
            }
            if (change.type === 'modified' && data.status === 'waiting_approval') {
                get().addNotification({
                  type: 'info',
                  title: 'Validation Requise',
                  message: `Nouveau rapport reçu de ${DUMMY_USERS.find(u => u.id === data.tech_id)?.name || 'Technicien'} pour ${data.address}.`
                });
            }
            if (change.type === 'modified' && data.status === 'done') {
                get().addNotification({
                  type: 'success',
                  title: 'Mission Clôturée',
                  message: `Rapport validé pour ${data.address}. Encaissement généré.`
                });
            }
          });
        });

        // 6. Listen for Clients
        try {
            onSnapshot(collection(db, 'clients'), (snapshot) => {
                const clients = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client));
                set({ clients });
            });
        } catch (e) { console.error("Clients listener error:", e); }
      },

  addClient: async (client: Omit<Client, 'id'>) => {
    try {
      // Normalize phone number before saving
      const cleanPhone = client.phone ? client.phone.replace(/[\s\.\-\(\)]/g, '') : '';
      const docRef = await addDoc(collection(db, 'clients'), {
        ...client,
        phone: cleanPhone,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding client: ", e);
    }
  },

  updateClient: async (id: string, updates: Partial<Client>) => {
    try {
      const clientRef = doc(db, 'clients', id);
      const cleanUpdates = { ...updates };
      if (cleanUpdates.phone) {
        cleanUpdates.phone = cleanUpdates.phone.replace(/[\s\.\-\(\)]/g, '');
      }
      await updateDoc(clientRef, cleanUpdates);
    } catch (e) {
      console.error("Error updating client: ", e);
    }
  },

  deleteClient: async (id: string) => {
    try {
      const clientRef = doc(db, 'clients', id);
      await deleteDoc(clientRef);
      // Also cleanup assets and interventions related to this client? 
      // For now just client.
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        currentProfileClient: state.currentProfileClient?.id === id ? null : state.currentProfileClient
      }));
    } catch (e) {
      console.error("Error deleting client: ", e);
    }
  },

      updateIntervention: async (id, updates) => {
        const oldIntervention = get().interventions.find(i => i.id === id);
        
        // 1. Optimistic Update (Immediate UI response)
        set((state) => ({
          interventions: state.interventions.map((int) => 
            int.id === id ? { ...int, ...updates } : int
          )
        }));

        // Log Activity in Client History
        if (oldIntervention && updates.status && updates.status !== oldIntervention.status) {
          const clientId = oldIntervention.client_id || (get().assets.find(a => a.id === oldIntervention.asset_id)?.client_id);
          if (clientId) {
             const statusLabels: Record<string, string> = {
                'done': 'Mission Terminée ✅',
                'in_progress': 'Technicien en route / sur place 🛠️',
                'waiting_approval': 'Attente validation devis ⏳',
                'pending': 'Mission reprogrammée / en attente 📅'
             };
             get().addClientActivity(clientId, {
               type: 'intervention',
               title: statusLabels[updates.status] || `Status mis à jour : ${updates.status}`,
               description: `L'intervention à ${oldIntervention.address} est passée au statut ${updates.status}.`,
             } as any);
          }
        }

        // AUTOMATION: Reputation Management (Google Reviews)
        if (updates.status === 'done' && oldIntervention?.status !== 'done') {
            const intervention = oldIntervention;
            // Traverse Intervention -> Asset -> Client
            const asset = get().assets.find(a => a.id === intervention?.asset_id);
            const client = asset ? get().clients.find(c => c.id === asset.client_id) : null;
            const clientName = client?.name || "Client";
            
            // Simulate SMS sending delay
            setTimeout(() => {
                get().addNotification({
                    type: 'success',
                    title: '⭐ E-Réputation : SMS Envoyé',
                    message: `Demande d'avis Google 5★ envoyée automatiquement à ${clientName}. (+15% de conversion)`
                });
            }, 2000);
        }

        // 2. Background Sync with Firebase (Non-blocking)
        const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (isFirebaseConfigured) {
          const docRef = doc(db, 'interventions', id);
          updateDoc(docRef, updates).catch(e => {
            console.error("Delayed sync to Firebase failed: ", e);
          });
        }
      },

      generateClientPortalLink: (clientId: string) => {
         const client = get().clients.find(c => c.id === clientId);
         if (!client) return;
         
         const link = `${window.location.origin}/portal/${clientId}?token=${Math.random().toString(36).substr(2)}`;
         
         get().addNotification({
             type: 'info',
             title: '🔑 Accès B2B Généré',
             message: `Lien "Magic Link" pour le syndic ${client.name} copié et enregistré dans l'historique.`
         });
         
         // Log activity
         get().addClientActivity(clientId, {
           type: 'note',
           title: 'Accès Portail Généré',
           description: `Un lien d'accès direct au portail client a été généré par un administrateur.`,
         } as any);

         return link;
      },

      deleteIntervention: async (id) => {
        try {
          const { deleteDoc } = await import('firebase/firestore');
          const docRef = doc(db, 'interventions', id);
          await deleteDoc(docRef);
        } catch (e) {
          console.error("Error deleting intervention: ", e);
          set((state) => ({
            interventions: state.interventions.filter((int) => int.id !== id)
          }));
        }
      },

      decrementStock: (itemId, quantity) => set((state) => ({
        inventory: state.inventory.map((item) => 
          item.id === itemId ? { ...item, quantity: item.quantity - quantity } : item
        )
      })),

      transferVanStock: (fromTechId, toTechId, itemId, quantity) => set((state) => {
        const fromTechName = state.users.find(u => u.id === fromTechId)?.name || 'Tech A';
        const toTechName = state.users.find(u => u.id === toTechId)?.name || 'Tech B';
        const itemName = state.inventory.find(i => i.id === itemId)?.item_name || 'Pièce';

        const newVanStocks = state.vanStocks.map(vs => 
          (vs.tech_id === fromTechId && vs.item_id === itemId) 
            ? { ...vs, quantity: Math.max(0, vs.quantity - quantity) } 
            : vs
        );

        const destStockEntryIdx = newVanStocks.findIndex(vs => vs.tech_id === toTechId && vs.item_id === itemId);
        
        if (destStockEntryIdx > -1) {
          newVanStocks[destStockEntryIdx] = { 
            ...newVanStocks[destStockEntryIdx], 
            quantity: newVanStocks[destStockEntryIdx].quantity + quantity 
          };
        } else {
          newVanStocks.push({ tech_id: toTechId, item_id: itemId, quantity });
        }

        get().addNotification({
          type: 'success',
          title: 'IA Logistics : Flux Validé',
          message: `Optimisation réussie : ${quantity}x ${itemName} transféré de ${fromTechName} vers ${toTechName}.`
        });

        return { vanStocks: newVanStocks };
      }),

      simulateClientTracking: async (id) => {
        const intervention = get().interventions.find(i => i.id === id);
        if (!intervention) return;
        
        const updates = {
          tracking_active: true,
          tracking_url: `${window.location.origin}/track/${id}`, // Real link to internal page
          status: 'in_progress' as const
        };

        // Optimistic update
        get().updateIntervention(id, updates);

        get().addNotification({
          type: 'info',
          title: 'Lien Magique Activé',
          message: `Le client a reçu son lien de suivi : ${updates.tracking_url}`
        });

        // Backend Sync
        try {
          const docRef = doc(db, 'interventions', id);
          // @ts-ignore
          await updateDoc(docRef, updates);
        } catch(e) { console.error("Tracking update failed", e); }
      },

      checkSmartDispatch: async (intervention) => {
         // Only run for pending acts
         if (intervention.status !== 'pending') return;

         // Ensure we have coords
         if (!intervention.latitude || !intervention.longitude) return;

         const currentTechId = intervention.tech_id;
         const zones = get().zones;
         const users = get().users;

         // Find which zone this point belongs to
         const point = { lat: intervention.latitude, lng: intervention.longitude };
         
         const correctZone = zones.find(z => isPointInPolygon(point, z.positions || []));
         
         if (correctZone && correctZone.techId !== currentTechId) {
             // MISMATCH DETECTED!
             const correctTech = users.find(u => u.id === correctZone.techId);
             const previousTech = users.find(u => u.id === currentTechId);
             
             if (!correctTech) return;

             console.log(`Smart Dispatch: Reassigning from ${previousTech?.name} to ${correctTech.name}`);

             // Perform assignment
             await get().updateIntervention(intervention.id, {
                 tech_id: correctTech.id
             });

             // Notify
             get().addNotification({
                 type: 'info',
                 title: 'Smart Dispatch 🤖',
                 message: `Trajet optimisé : Mission réassignée automatiquement de ${previousTech?.name} à ${correctTech.name} (Zone ${correctZone.name}).`
             });
         }
      },

      securityIncidents: [],
      addSecurityIncident: (incident: SentinelEvent) => set((state) => {
        if (state.securityIncidents.some(i => i.id === incident.id)) return state;
        return { securityIncidents: [incident, ...state.securityIncidents].slice(0, 50) };
      }), // Keep last 50, deduped

      initSentinel: () => {
          const { NewsSentinel } = require('@/services/news-sentinel');
          NewsSentinel.startListening((event: SentinelEvent) => {
              get().addSecurityIncident(event);
              get().addNotification({
                  type: 'alert',
                  title: `ALERTE ${event.type.toUpperCase()}`,
                  message: event.description
              });
          });
      },

      addIntervention: async (intervention) => {
        try {
          const { id, ...data } = intervention;
          const newInt = { ...intervention };
          if (!newInt.id) newInt.id = Math.random().toString(36).substr(2, 9);
          
          // Mock Geocoding if missing (Center of Brussels approx)
          if (!newInt.latitude) {
             // Randomly place in one of the zones for demo purposes
             // Or just slight offset from Brussels center
             newInt.latitude = 50.8503 + (Math.random() - 0.5) * 0.05;
             newInt.longitude = 4.3517 + (Math.random() - 0.5) * 0.05;
          }

          await addDoc(collection(db, 'interventions'), newInt);

          // Log in client history
          const clientId = intervention.client_id || (get().assets.find(a => a.id === intervention.asset_id)?.client_id);
          if (clientId) {
            get().addClientActivity(clientId, {
              type: 'intervention',
              title: '📅 Nouvelle Mission Créée',
              description: `Une mission (${intervention.category}) a été planifiée pour le ${intervention.date} à ${intervention.time} au ${intervention.address}.`,
            } as any);
          }
        } catch (e) {
          console.error("Error adding intervention: ", e);
        }
      },

      addMessage: async (msg) => {
        try {
          await addDoc(collection(db, 'messages'), {
            ...msg,
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error("Error adding message: ", e);
        }
      },
      
      updateZones: async (newZones) => {
        // Update local state immediately for responsiveness
        set({ zones: newZones });
        
        // Save to Firebase for cross-device sync
        try {
          const zonesDocRef = doc(db, 'settings', 'zones');
          await setDoc(zonesDocRef, { zones: newZones }, { merge: true });
        } catch (e) {
          console.error("Error saving zones to Firebase:", e);
          // Local state is already updated, so user sees the change even if Firebase fails
        }
      },

      seedData: async () => {
        const today = new Date().toISOString().split('T')[0];
        const dummyInts: Intervention[] = [
          // === MARC (id: 2) — 3 missions ===
          {
            id: 'int1',
            tech_id: '2',
            asset_id: 'a1',
            date: today,
            time: '08:30',
            category: 'emergency',
            is_emergency: true,
            status: 'done',
            address: 'Grand Place 1, 1000 Bruxelles',
            description: 'Client enfermé dehors — ouverture fine porte blindée A2P',
            latitude: 50.8467, longitude: 4.3524,
            estimated_duration: 45,
            labor_cost: 120,
            parts_used: [{ item_id: 'i1', quantity: 1 }],
            payment_status: 'paid',
            payment_method: '3x'
          },
          {
            id: 'int2',
            tech_id: '2',
            asset_id: 'a1',
            date: today,
            time: '11:00',
            category: 'installation',
            status: 'in_progress',
            address: 'Avenue Louise 120, 1050 Bruxelles',
            description: 'Installation serrure connectée Yale Linus Pro — bureau 3ème étage',
            latitude: 50.8250, longitude: 4.3640,
            estimated_duration: 90,
            labor_cost: 150,
            parts_used: [{ item_id: 'i3', quantity: 1 }],
            payment_status: 'unpaid'
          },
          {
            id: 'int3',
            tech_id: '2',
            asset_id: 'a2',
            date: today,
            time: '15:00',
            category: 'maintenance',
            status: 'pending',
            address: 'Rue Royale 10, 1000 Bruxelles',
            description: 'Maintenance annuelle résidence — 12 cylindres à vérifier',
            latitude: 50.8440, longitude: 4.3610,
            estimated_duration: 120,
            labor_cost: 200,
            parts_used: [],
            payment_status: 'unpaid'
          },
          // === SOPHIE (id: 3) — 3 missions ===
          {
            id: 'int4',
            tech_id: '3',
            asset_id: 'a2',
            date: today,
            time: '09:15',
            category: 'installation',
            status: 'done',
            address: 'Rue de la Loi 16, 1000 Bruxelles',
            description: 'Pose contrôle d\'accès Vigik + lecteur badge immeuble',
            latitude: 50.8460, longitude: 4.3790,
            estimated_duration: 60,
            labor_cost: 180,
            parts_used: [{ item_id: 'i5', quantity: 1 }],
            payment_status: 'paid',
            payment_method: 'transfer'
          },
          {
            id: 'int5',
            tech_id: '3',
            asset_id: 'a1',
            date: today,
            time: '13:30',
            category: 'repair',
            status: 'waiting_approval',
            address: 'Rue Neuve 123, 1000 Bruxelles',
            description: 'Réparation serrure multipoint bloquée — porte d\'entrée',
            latitude: 50.8520, longitude: 4.3560,
            estimated_duration: 45,
            labor_cost: 95,
            parts_used: [{ item_id: 'i1', quantity: 1 }, { item_id: 'i13', quantity: 2 }],
            payment_status: 'unpaid'
          },
          {
            id: 'int6',
            tech_id: '3',
            asset_id: 'a2',
            date: today,
            time: '16:45',
            category: 'installation',
            status: 'pending',
            address: 'Place Flagey 7, 1050 Ixelles',
            description: 'Installation système Nuki Pro — porte cochère résidence premium',
            latitude: 50.8270, longitude: 4.3740,
            estimated_duration: 75,
            labor_cost: 160,
            parts_used: [],
            payment_status: 'unpaid'
          },
          // === LUCAS (id: 4) — 3 missions ===
          {
            id: 'int7',
            tech_id: '4',
            asset_id: 'a1',
            date: today,
            time: '08:00',
            category: 'repair',
            status: 'done',
            address: 'Chaussée de Waterloo 450, 1050 Ixelles',
            description: 'Renforcement blindage porte cave — soudure plaque manganèse',
            latitude: 50.8180, longitude: 4.3620,
            estimated_duration: 90,
            labor_cost: 220,
            parts_used: [{ item_id: 'i20', quantity: 2 }],
            payment_status: 'paid',
            payment_method: 'cash'
          },
          {
            id: 'int8',
            tech_id: '4',
            asset_id: 'a1',
            date: today,
            time: '12:30',
            category: 'emergency',
            is_emergency: true,
            status: 'in_progress',
            address: 'Rue Haute 15, 1000 Bruxelles',
            description: 'Effraction détectée — remplacement serrure 3 points + blindage',
            latitude: 50.8410, longitude: 4.3510,
            estimated_duration: 120,
            labor_cost: 280,
            parts_used: [{ item_id: 'i4', quantity: 1 }, { item_id: 'i20', quantity: 1 }],
            payment_status: 'unpaid'
          },
          {
            id: 'int9',
            tech_id: '4',
            asset_id: 'a2',
            date: today,
            time: '17:00',
            category: 'repair',
            status: 'pending',
            address: 'Avenue de Tervueren 2, 1040 Etterbeek',
            description: 'Porte de cave coincée — diagnostic et réparation',
            latitude: 50.8400, longitude: 4.3980,
            estimated_duration: 60,
            labor_cost: 90,
            parts_used: [],
            payment_status: 'unpaid'
          },
          // === HUGO (id: 5) — 1 mission (astreinte) ===
          {
            id: 'int10',
            tech_id: '5',
            asset_id: 'a1',
            date: today,
            time: '19:00',
            category: 'automotive',
            status: 'pending',
            address: 'Rue de la Victoire, 1060 Saint-Gilles',
            description: 'Programmation clé transpondeur BMW X3 — client sur parking',
            latitude: 50.8280, longitude: 4.3480,
            estimated_duration: 60,
            labor_cost: 180,
            parts_used: [],
            payment_status: 'unpaid'
          },
          // === YANIS (id: 6) — 2 missions ===
          {
            id: 'int11',
            tech_id: '6',
            asset_id: 'a2',
            date: today,
            time: '10:00',
            category: 'maintenance',
            status: 'done',
            address: 'Chaussée d\'Alsemberg, 1180 Uccle',
            description: 'Maintenance trimestrielle gérance — 8 portes, 3 badges Vigik',
            latitude: 50.8030, longitude: 4.3350,
            estimated_duration: 180,
            labor_cost: 350,
            parts_used: [{ item_id: 'i1', quantity: 2 }, { item_id: 'i13', quantity: 3 }],
            payment_status: 'paid',
            payment_method: 'transfer'
          },
          {
            id: 'int12',
            tech_id: '6',
            asset_id: 'a1',
            date: today,
            time: '15:30',
            category: 'installation',
            status: 'pending',
            address: 'Avenue Brugmann, 1190 Forest',
            description: 'Installation coffre-fort encastré La Gard — serrure électronique',
            latitude: 50.8120, longitude: 4.3450,
            estimated_duration: 90,
            labor_cost: 200,
            parts_used: [],
            payment_status: 'unpaid'
          }
        ];

        for (const int of dummyInts) {
          const { id, ...data } = int;
          try {
             await setDoc(doc(db, 'interventions', id), data);
          } catch(e) { console.error("Seed error", e); }
        }
        
        try {
            await addDoc(collection(db, 'messages'), {
            sender_id: '1',
            text: 'Système Firebase initialisé. Prêt pour le live !',
            timestamp: serverTimestamp()
            });
        } catch(e) { console.error("Seed msg error", e); }

        // Seed Users
        for (const user of DUMMY_USERS) {
           await setDoc(doc(db, 'users', user.id), user);
        }
        
        // Seed Inventory
        for (const item of DUMMY_INVENTORY) {
           await setDoc(doc(db, 'inventory', item.id), item);
        }

        // Seed Assets
        for (const asset of DUMMY_ASSETS) {
           await setDoc(doc(db, 'assets', asset.id), asset);
        }

        // Seed Clients
        for (const client of DUMMY_CLIENTS) {
           await setDoc(doc(db, 'clients', client.id), client);
        }

        // Seed Van Stocks
        // Note: VanStock usually doesn't have an ID in the type, so we might need generated IDs or a composite key approach.
        // For simplicity in this "toy-to-pro" transition, let's treat them as individual docs.
        for (const stock of DUMMY_VAN_STOCKS) {
            await addDoc(collection(db, 'van_stocks'), stock);
        }

        // Seed Schedules
         for (const schedule of DUMMY_SCHEDULES) {
           await setDoc(doc(db, 'schedules', schedule.id), schedule);
        }

      },
}));
