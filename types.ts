
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
  PANEER = 'PANEER'
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
  color: string;
}

export interface AddOn {
  name: string;
  price: number;
  desc: string;
  id: string;
  allowSubscription?: boolean; // New flag for Kefir logic
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
    id: string;
    protein: ProteinType;
    startDate: string;
    totalDays: number;
    daysRemaining: number;
    status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
    mealsPerDay: number;
    addons: AddOnSelection[]; // Track active subscription addons
}

export interface DailyKitchenStats {
    chickenCount: number;
    paneerCount: number;
    addonsCount: Record<string, number>;
}

// --- ADMIN TYPES ---
export interface OrderHistoryItem {
    orderId: string;
    date: string;
    amount: number;
    description: string;
    status: 'PAID' | 'PENDING' | 'FAILED';
}

export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    subscription: UserSubscription;
    orderHistory: OrderHistoryItem[];
    notes?: string;
}
