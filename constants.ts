import { MenuItem, PricingTier, ProteinType, AddOn } from './types';

export const CONTACT_INFO = {
  phone: "+91 73877 65018",
  whatsapp: "917387765018",
  instagram: "@thehealthycanteen",
  email: "thccloudkitchen@gmail.com",
  address: "B-22 Privia Business Center, Moshi, Pune"
};

// Base rates derived from PDF (Monthly Plan rates)
// Chicken: 6720 / 24 = 280
// Paneer: 6120 / 24 = 255
// Short term rates might be higher, but let's base calculations on these benchmarks for consistency with the prompt.
export const BASE_RATES = {
    [ProteinType.CHICKEN]: 320, // Base single meal rate (discounted in bulk)
    [ProteinType.PANEER]: 300   // Base single meal rate (discounted in bulk)
};

export const SUBSCRIPTION_RATES = {
    [ProteinType.CHICKEN]: 280, // Rate for 24+ days
    [ProteinType.PANEER]: 255   // Rate for 24+ days
};

export const MENU_ITEMS: Record<ProteinType, MenuItem> = {
  [ProteinType.CHICKEN]: {
    name: "Chicken Meal",
    calories: 730,
    protein: 60,
    description: "250g Raw ≈ 200g Cooked. Herb Grilled, Peri-Peri, Lemon Pepper, Cajun, or Light Tandoori.",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
    color: "bg-quirky-yellow"
  },
  [ProteinType.PANEER]: {
    name: "Paneer Meal",
    calories: 900,
    protein: 40,
    description: "200g Fresh Paneer. Naturally higher in fats. Prepared in various rotational styles.",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop",
    color: "bg-quirky-pink"
  }
};

export const SIDES = [
  "Steamed Rice",
  "Lemon Herb Rice",
  "Sourdough Bread",
  "Baked/Mashed Potatoes",
  "Fresh Garden Salad",
  "Herbed Garlic Veggies",
  "Exotic Sautéed Veggies"
];

export const ADD_ONS: AddOn[] = [
  { id: 'kefir', name: "Probiotic Kefir (275ml)", price: 99, desc: "Naturally fermented, gut-healthy.", allowSubscription: true }
];

export const DELIVERY_FEE_MONTHLY = 300;