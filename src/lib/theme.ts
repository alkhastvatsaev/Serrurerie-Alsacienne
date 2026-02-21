// Theme constants for consistent design across the app

// Tech Colors - Consistent across all components
export const TECH_COLORS = {
  '2': '#007AFF', // Marc - Blue
  '3': '#FF9500', // Sophie - Orange
  '4': '#34C759', // Lucas - Green
  '5': '#5856D6', // Hugo - Purple
  '6': '#FF2D55', // Yanis - Pink
  '7': '#06B6D4', // Thomas - Cyan
  default: '#8E8E93', // Unknown - Gray
} as const;

export const getTechColor = (techId: string): string => {
  return TECH_COLORS[techId as keyof typeof TECH_COLORS] || TECH_COLORS.default;
};

// Status Colors
export const STATUS_COLORS = {
  pending: '#007AFF',      // Blue
  in_progress: '#5856D6',  // Purple
  waiting_approval: '#FF9500', // Orange
  done: '#34C759',         // Green
  cancelled: '#FF3B30',    // Red
} as const;

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
};

// Payment Status Colors
export const PAYMENT_COLORS = {
  paid: '#34C759',     // Green
  unpaid: '#FF9500',   // Orange
  pending: '#007AFF',  // Blue
} as const;

export const getPaymentColor = (status: string): string => {
  return PAYMENT_COLORS[status as keyof typeof PAYMENT_COLORS] || PAYMENT_COLORS.pending;
};

// UI Constants
export const UI_CONSTANTS = {
  // Border Radius
  borderRadius: {
    sm: '0.75rem',    // 12px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.05)',
    md: '0 4px 8px rgba(0,0,0,0.1)',
    lg: '0 8px 16px rgba(0,0,0,0.15)',
    xl: '0 12px 24px rgba(0,0,0,0.2)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  // Z-Index layers
  zIndex: {
    map: 0,
    mapControls: 10,
    sidebar: 30,
    header: 40,
    modal: 50,
    tooltip: 60,
  },
} as const;

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: '0.625rem',   // 10px
    sm: '0.75rem',    // 12px
    base: '0.875rem', // 14px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
  },
  
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
} as const;

// Animation variants
export const ANIMATIONS = {
  fadeIn: 'animate-in fade-in duration-200',
  slideInLeft: 'animate-in slide-in-from-left duration-300',
  slideInRight: 'animate-in slide-in-from-right duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  pulse: 'animate-pulse',
} as const;

// Glassmorphism styles
export const GLASS_STYLES = {
  light: 'bg-white/80 backdrop-blur-xl border border-black/5',
  medium: 'bg-white/90 backdrop-blur-xl border border-black/10',
  dark: 'bg-black/80 backdrop-blur-xl border border-white/10',
} as const;
