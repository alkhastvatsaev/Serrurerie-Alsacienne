export type UserRole = "admin" | "tech";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  status: "active" | "inactive";
  avatar_url?: string;
  phone?: string;
  email?: string;
  specialties?: string[];
  performance_score?: number;
  completed_missions?: number;
}

export interface ActivityItem {
  id: string;
  type: 'email' | 'call' | 'intervention' | 'note' | 'document' | 'asset' | 'stock';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  metadata?: {
    tech_ids?: string[];
    duration?: number;
    tech_id?: string;
    tech_name?: string;
    direction?: 'inbound' | 'outbound';
    email_id?: string;
  };
}

export interface Client {
  id: string;
  name: string;
  address: string;
  contact_info: string;
  phone?: string;
  email?: string;
  last_contact_date?: string;
  activities?: ActivityItem[];
}

export interface Asset {
  id: string;
  client_id: string;
  qr_code_id: string;
  description: string;
  specifications: {
    brand: string;
    cylinder_size: string;
    shielding_type: string;
    [key: string]: string | number | undefined;
  };
  last_service_date: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  min_threshold: number;
}

export interface VanStock {
  tech_id: string;
  item_id: string;
  quantity: number;
}

export interface Intervention {
  id: string;
  tech_id: string; // Primary tech
  tech_ids?: string[]; // All techs involved (multi-day/complex)
  asset_id: string;
  client_id?: string; // Explicitly link to client for easier lookup
  date: string;
  time: string;
  status: "pending" | "in_progress" | "waiting_approval" | "done";
  photos_url?: string[];
  customer_signature?: string;
  parts_used: {
    item_id: string;
    quantity: number;
  }[];
  payment_status: "paid" | "unpaid";
  payment_method?: "transfer" | "card" | "cash" | "apple_pay" | "3x";
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  estimated_duration?: number; // duration in minutes
  labor_cost?: number;
  is_emergency?: boolean;
  discount?: number;
  category?: "emergency" | "installation" | "repair" | "maintenance" | "automotive" | "safe" | "access_control";
  tracking_url?: string;
  tracking_active?: boolean;
  social_emergency_type?: "none" | "baby_inside" | "pet_trapped" | "elderly_person";
  history?: {
    date: string;
    tech_ids?: string[];
    tech_name: string;
    notes: string;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  type: 'hardware' | 'tools' | 'security' | 'general';
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
  specialties?: string[];
  logo_url?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'stock' | 'tech' | 'payment' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface WorkSchedule {
  id: string;
  tech_id: string;
  date: string; // ISO date string or YYYY-MM-DD
  start_time: string;
  end_time: string;
  type: 'working' | 'off' | 'on_call';
}

export interface ZonePosition {
  lat: number;
  lng: number;
}

export interface Zone {
  techId: string;
  name: string;
  color: string;
  positions: ZonePosition[];
}
