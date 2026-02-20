
export interface PricingTier {
  days: number;
  mealsPerDay: number;
  chickenPrice: number;
  paneerPrice: number;
  label: string;
  description?: string;
  isTrial?: boolean;
  rating?: number;
  votes?: string;
}

export enum ProteinType {
  CHICKEN = 'CHICKEN',
  PANEER = 'PANEER',
  VEGAN = 'VEGAN',
  SALAD = 'SALAD'
}

export enum MealType {
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  BOTH = 'BOTH'
}

export interface MenuItem {
  name: string;
  calories: number;
  protein: number;
  description: string;
  image: string;
  thumbnail?: string;
  images?: string[];
  qty?: number;
  color: string;
  id?: number; // Added optional ID
}

export interface AddOn {
  id: number | string;
  name: string;
  price: number;
  description?: string;
  desc?: string; // Compatible with constants
  image?: string;
  thumbnail?: string;
  allowSubscription: boolean; // New flag for Kefir logic
}

export interface AddOnSelection {
  quantity: number;
  frequency: 'once' | 'daily';
}

export interface OrderConfig {
  days: number;
  mealsPerDay: number;
  protein: ProteinType;
  basePrice: number;
  totalPrice: number;
}

// New Types for Backend Readiness
export interface UserSubscription {
  id: number; // Changed to number to match backend if needed, or keep string
  protein: ProteinType;
  startDate: string;
  endDate: string; // Added
  totalDays: number; // Maybe optional?
  daysRemaining: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  mealsPerDay: number;
  addons: Record<string, AddOnSelection> | AddOnSelection[]; // Backend uses JSONB, might be object or array
  pausesRemaining: number;
  deliveryAddress: string;
  deliveryLogs?: DeliveryLog[];
}

export interface DeliveryLog {
  id: number;
  subscriptionId: number;
  deliveryTime: string; // ISO date string
  status: 'PENDING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  userId?: number; // Rider ID
  deliveryAgent?: { // Populated rider details
    name: string;
    phone: string;
  };
}

// Fixed backend types often use number IDs
export interface UserSubscriptionBackend {
  id: number;
  // ... mapped fields
}


export interface DailyKitchenStats {
  chickenCount: number;
  paneerCount: number;
  addonsCount: Record<string, number>;
}

// --- ADMIN TYPES ---
export interface OrderHistoryItem {
  id?: number;
  orderId: string;
  date: string;
  amount: number;
  description: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  totalPrice?: number;
  createdAt: string;
  protein: string;
  days: number;
}

export interface CustomerProfile {
  id: string; // User ID
  name: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  createdAt?: string;
  subscriptions?: UserSubscription[]; // Array of subs
  orders?: OrderHistoryItem[];
  notes?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'delivery' | 'alert' | 'success';
  isRead: boolean;
  createdAt: string;
}
