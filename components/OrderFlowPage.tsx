import React, { useState, useEffect, useRef } from 'react';
import { BASE_RATES, SUBSCRIPTION_RATES, DELIVERY_FEE_MONTHLY } from '../constants';
import { settings } from '../src/services/api';
import { getDistanceKm } from '../src/utils/haversine';
import { ProteinType, AddOnSelection, AddOn } from '../types';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Check, Plus, Minus, MapPin, Navigation, Receipt, LayoutList, X, Zap } from 'lucide-react';
import { orders, menu, BASE_URL } from '../src/services/api';



interface OrderFlowPageProps {
    onBack: () => void;
}

// Global Definitions
declare global {
    interface Window {
        google: any;
    }
}

// Dynamic Map Loader
const loadGoogleMaps = (apiKey: string) => {
    return new Promise((resolve, reject) => {
        // Check specifically for .maps, because Google One Tap also uses window.google
        if (window.google && window.google.maps) return resolve(window.google);

        // Check if script is already appended to avoid duplicates
        const existingScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.google));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

export const OrderFlowPage: React.FC<OrderFlowPageProps> = ({ onBack }) => {
    // --- Wizard State ---
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // --- Step 1: Selection State ---
    const [days, setDays] = useState<number>(24);
    const [mealsPerDay, setMealsPerDay] = useState<number>(1);

    // Dynamic Menu State
    const [plans, setPlans] = useState<any[]>([]);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loadingMenu, setLoadingMenu] = useState(true);

    const [addons, setAddons] = useState<Record<string, AddOnSelection>>({});
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
    const [kefirAddon, setKefirAddon] = useState<AddOn | null>(null);

    // --- Addon Modal State ---
    const [activeAddonModal, setActiveAddonModal] = useState<AddOn | null>(null);

    // --- Step 2: Details & Map State ---
    const [form, setForm] = useState({ name: '', phone: '', email: '', flatDetails: '' });
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const circleInstance = useRef<any>(null);

    // --- Service Area State ---
    const [serviceArea, setServiceArea] = useState<{ outletLat: number; outletLng: number; serviceRadiusKm: number } | null>(null);
    const [isInZone, setIsInZone] = useState<boolean | null>(null);
    const [distanceFromOutlet, setDistanceFromOutlet] = useState<number | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');

    // Pre-fill form from localStorage
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setForm(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, []);

    // --- Calculations ---
    const [basePlanTotal, setBasePlanTotal] = useState<number>(0);

    useEffect(() => {
        if (!selectedItem) return;
        setBasePlanTotal(selectedItem.price * days * mealsPerDay);
    }, [days, mealsPerDay, selectedItem]);

    const calculateAddonTotal = () => {
        let total = 0;
        Object.keys(addons).forEach(key => {
            const selection = addons[key];
            const addonDef = availableAddons.find(a => a.id.toString() === key);
            if (addonDef && selection.quantity > 0) {
                const price = addonDef.price;
                if (selection.frequency === 'daily') total += price * selection.quantity * days;
                else total += price * selection.quantity;
            }
        });
        return total;
    };

    // Delivery Fee: <= 5 days: 50 * days, > 5 days: 300 Fixed
    const deliveryFee = days <= 5 ? 50 * days : 300;
    const addonTotal = calculateAddonTotal();
    const grandTotal = basePlanTotal + addonTotal + deliveryFee;

    // --- Handlers ---
    const updateAddon = (id: string, delta: number, frequency: 'once' | 'daily' = 'once') => {
        setAddons(prev => {
            const current = prev[id]?.quantity || 0;
            const newQty = Math.max(0, current + delta);
            return { ...prev, [id]: { quantity: newQty, frequency } };
        });
    };

    const handleAddonClick = (addon: AddOn) => {
        const currentQty = addons[addon.id]?.quantity || 0;
        if (currentQty === 0 && addon.allowSubscription) {
            setActiveAddonModal(addon);
        } else {
            const currentFreq = addons[addon.id]?.frequency || 'once';
            updateAddon(addon.id.toString(), 1, currentFreq);
        }
    };

    const handleModalSelection = (frequency: 'once' | 'daily') => {
        if (activeAddonModal) {
            updateAddon(activeAddonModal.id, 1, frequency);
            setActiveAddonModal(null);
        }
    };

    // --- Fetch Service Area ---
    useEffect(() => {
        settings.getServiceArea().then(res => {
            setServiceArea(res.data);
        }).catch(() => {
            setServiceArea({ outletLat: 18.654949627383616, outletLng: 73.84475261136429, serviceRadiusKm: 5 });
        });
    }, []);

    // Check distance whenever location or serviceArea changes
    const checkZone = (loc: { lat: number; lng: number }) => {
        if (!serviceArea) return;
        const dist = getDistanceKm(serviceArea.outletLat, serviceArea.outletLng, loc.lat, loc.lng);
        setDistanceFromOutlet(parseFloat(dist.toFixed(1)));
        setIsInZone(dist <= serviceArea.serviceRadiusKm);
    };

    // --- Map Logic ---
    useEffect(() => {
        if (currentStep === 2) {
            const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

            if (!apiKey) {
                console.error("VITE_GOOGLE_MAPS_API_KEY is missing from environment variables");
                alert("Google Maps API Key is missing! Please add VITE_GOOGLE_MAPS_API_KEY to your .env.local file and restart the server.");
                return;
            }

            loadGoogleMaps(apiKey).then(() => {
                if (!window.google || !window.google.maps) {
                    console.error("window.google.maps is not available after load");
                    alert("Google Maps failed to load (window.google.maps missing). Check console.");
                    return;
                }

                if (!mapRef.current) {
                    console.error("mapRef.current is missing");
                    return;
                }

                try {
                    const defaultPos = { lat: 18.6298, lng: 73.7997 };

                    if (!googleMapInstance.current) {
                        googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
                            center: defaultPos,
                            zoom: 15,
                            disableDefaultUI: true,
                            zoomControl: true,
                        });

                        window.google.maps.event.clearListeners(googleMapInstance.current, 'click');
                        googleMapInstance.current.addListener("click", (e: any) => {
                            if (markerInstance.current) {
                                markerInstance.current.setPosition(e.latLng);
                                const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                setLocation(loc);
                                checkZone(loc);
                            }
                        });
                    }

                    if (!markerInstance.current) {
                        markerInstance.current = new window.google.maps.Marker({
                            position: defaultPos,
                            map: googleMapInstance.current,
                            draggable: true,
                            animation: window.google.maps.Animation.DROP,
                            title: "Your Healthy Food Spot"
                        });

                        markerInstance.current.addListener("dragend", () => {
                            const pos = markerInstance.current.getPosition();
                            const loc = { lat: pos.lat(), lng: pos.lng() };
                            setLocation(loc);
                            checkZone(loc);
                        });

                        if (location) {
                            markerInstance.current.setPosition(location);
                            googleMapInstance.current.setCenter(location);
                        } else {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const pos = {
                                            lat: position.coords.latitude,
                                            lng: position.coords.longitude,
                                        };
                                        googleMapInstance.current.setCenter(pos);
                                        markerInstance.current.setPosition(pos);
                                        setLocation(pos);
                                        checkZone(pos);
                                        setLocationPermission('granted');
                                    },
                                    (error) => {
                                        console.warn("Geolocation failed", error);
                                        setLocationPermission('denied');
                                    },
                                    { enableHighAccuracy: true }
                                );
                            } else {
                                setLocationPermission('denied');
                            }
                        }
                    }

                    if (serviceArea) {
                        if (circleInstance.current) {
                            circleInstance.current.setMap(null);
                        }

                        circleInstance.current = new window.google.maps.Circle({
                            map: googleMapInstance.current,
                            center: { lat: serviceArea.outletLat, lng: serviceArea.outletLng },
                            radius: serviceArea.serviceRadiusKm * 1000,
                            fillColor: '#a3e635',
                            fillOpacity: 0.1,
                            strokeColor: '#3f6212',
                            strokeWeight: 2,
                            strokeOpacity: 0.6,
                        });

                        new window.google.maps.Marker({
                            position: { lat: serviceArea.outletLat, lng: serviceArea.outletLng },
                            map: googleMapInstance.current,
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: '#ef4444',
                                fillOpacity: 1,
                                strokeColor: '#000',
                                strokeWeight: 2,
                            },
                            title: 'Our Outlet'
                        });
                    }
                } catch (err) {
                    console.error("Map Initialization Error:", err);
                    alert("Map failed to initialize. Check console for details.");
                }
            }).catch(err => {
                console.error("Script Load Error:", err);
                alert("Google Maps script failed to load. Likely network or API Key issue.");
            });
        }
    }, [currentStep, serviceArea]);

    // Fetch Menu & Addons
    useEffect(() => {
        const fetchMenuAndAddons = async () => {
            try {
                const [menuRes, addonsRes] = await Promise.all([
                    menu.getAll(),
                    menu.getAddOns()
                ]);

                const fetchedPlans = menuRes.data;
                const fetchedAddons = addonsRes.data;

                setPlans(fetchedPlans);
                setAvailableAddons(fetchedAddons);

                const foundKefir = fetchedAddons.find((a: AddOn) =>
                    a.name.toLowerCase().includes('kefir')
                );
                if (foundKefir) setKefirAddon(foundKefir);

                if (fetchedPlans.length > 0) {
                    setSelectedItem(fetchedPlans[0].items[0]);
                }
            } catch (error) {
                console.error("Failed to load menu or addons", error);
            } finally {
                setLoadingMenu(false);
            }
        };

        fetchMenuAndAddons();
    }, []);

    const [loading, setLoading] = useState(false);

    // --- Upsell State ---
    const [showKefirUpsell, setShowKefirUpsell] = useState(false);

    const handleConfirmOrder = async () => {
        setLoading(true);
        try {
            const orderData = {
                protein: selectedItem?.name || 'Unknown',
                days,
                mealsPerDay,
                startDate: startDate,
                deliveryLat: location?.lat,
                deliveryLng: location?.lng,
                deliveryAddress: form.flatDetails,
                addons: addons,
                notes: notes
            };

            await orders.create(orderData);
            alert("Boom! You're in. Meal plan activated!");
            onBack();
        } catch (error) {
            console.error("Order Failed", error);
            alert("Something went wrong saving your order.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 1) {
            const targetKefirId = kefirAddon ? kefirAddon.id.toString() : 'kefir';
            if (kefirAddon && (!addons[targetKefirId] || addons[targetKefirId].quantity === 0)) {
                setShowKefirUpsell(true);
            } else {
                setCurrentStep(2);
            }
        }
        else if (currentStep === 2) {
            if (!form.name || !form.phone) {
                alert("Hey! We need your name and phone at least.");
                return;
            }
            if (!location) {
                alert("Drop a pin on the map so we know where to go!");
                return;
            }
            if (isInZone === false) {
                alert(`Sorry! We don't deliver to your area yet. You are ${distanceFromOutlet}km away.`);
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleUpsellChoice = (choice: 'skip' | 'once' | 'daily') => {
        if (choice !== 'skip' && kefirAddon) {
            updateAddon(kefirAddon.id.toString(), 1, choice);
        }
        setShowKefirUpsell(false);
        setCurrentStep(2);
    };

    const prevStep = () => {
        if (currentStep === 1) onBack();
        else setCurrentStep(prev => (prev - 1) as 1 | 2);
    };

    const renderProgressBar = () => (
        <div className="flex justify-center mb-8 md:mb-10 px-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-full border-2 border-black/10 shadow-sm flex items-center gap-4 md:gap-6">
                {/* Step 1 */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-heading border-3 border-black transition-all text-base md:text-lg ${currentStep >= 1 ? 'bg-quirky-yellow text-black shadow-hard' : 'bg-gray-100 text-gray-400'}`}>1</div>

                {/* Connector 1-2 */}
                <div className={`h-1 w-8 md:w-24 border-b-[6px] border-dotted ${currentStep >= 2 ? 'border-black' : 'border-gray-300'}`}></div>

                {/* Step 2 */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-heading border-3 border-black transition-all text-base md:text-lg ${currentStep >= 2 ? 'bg-quirky-pink text-white shadow-hard' : 'bg-gray-100 text-gray-400'}`}>2</div>

                {/* Connector 2-3 */}
                <div className={`h-1 w-8 md:w-24 border-b-[6px] border-dotted ${currentStep >= 3 ? 'border-black' : 'border-gray-300'}`}></div>

                {/* Step 3 */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-heading border-3 border-black transition-all text-base md:text-lg ${currentStep >= 3 ? 'bg-quirky-green text-black shadow-hard' : 'bg-gray-100 text-gray-400'}`}>3</div>
            </div>
        </div>
    );



    const getImageUrl = (name: string, imagePath?: string) => {
        if (imagePath) {
            // If it's already a full URL (http/https), use directly
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
            // If it's a relative path (e.g. /uploads/...), prepend BASE_URL
            return `${BASE_URL}${imagePath}`;
        }
        const lower = name.toLowerCase();
        if (lower.includes('chicken')) return "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop";
        if (lower.includes('paneer')) return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop";
        if (lower.includes('vegan') || lower.includes('veg') || lower.includes('salad')) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop";
        if (lower.includes('fish')) return "https://images.unsplash.com/photo-1519708227418-c8fd9a3a1b78?q=80&w=800&auto=format&fit=crop";
        if (lower.includes('egg')) return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=800&auto=format&fit=crop";
        return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";
    };

    const getAddonImageUrl = (name: string, imagePath?: string) => {
        if (imagePath) {
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
            return `${BASE_URL}${imagePath}`;
        }
        const lower = name.toLowerCase();
        if (lower.includes('kefir')) return "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop";
        if (lower.includes('cookie')) return "https://images.unsplash.com/photo-1499636138143-bd649043ea52?q=80&w=800&auto=format&fit=crop";
        if (lower.includes('drink') || lower.includes('juice')) return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop";
        return "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop";
    };

    return (
        <div className="min-h-screen pt-20 pb-44 md:pb-32 px-4 md:px-8 relative">
            {/* Global Background Gradient */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#f0fff4] to-white"></div>

            {/* Global Background Pattern - Diagonal Motion Lines (Fitness Vibe) */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 0, transparent 40px)' }}>
            </div>

            {/* Nav */}
            <nav className="fixed top-4 left-4 z-50">
                <button onClick={prevStep} className="bg-white border-3 border-black p-2 md:p-3 rounded-full shadow-hard hover:scale-110 transition-transform">
                    <ArrowLeft size={20} />
                </button>
            </nav>

            {renderProgressBar()}

            {/* UPSELL MODAL */}
            {showKefirUpsell && kefirAddon && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white border-4 border-black rounded-3xl shadow-hard max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header Image Area */}
                        <div className="h-64 bg-quirky-blue relative border-b-4 border-black p-4">
                            <img
                                src={getAddonImageUrl(kefirAddon.name, (kefirAddon as any).thumbnail || kefirAddon.image)}
                                alt={kefirAddon.name}
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                            <div className="absolute inset-0 pointer-events-none"></div>
                            <button
                                onClick={() => handleUpsellChoice('skip')}
                                className="absolute top-3 right-3 bg-white border-2 border-black rounded-full p-1 shadow-hard hover:bg-gray-100 cursor-pointer pointer-events-auto"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 text-center">
                            <h3 className="font-heading text-2xl mb-2 -rotate-1">WAIT! 🛑</h3>
                            <h4 className="font-heading text-lg text-quirky-purple mb-3 uppercase">{kefirAddon.name} OR REGRET IT! 🥛</h4>
                            <p className="font-body text-sm text-gray-600 mb-6">
                                {kefirAddon.description || "Probiotic Kefir is 99% better than soda. Add a boost to your meal plan?"}
                            </p>

                            <div className="space-y-3">
                                {kefirAddon.allowSubscription && (
                                    <button
                                        onClick={() => handleUpsellChoice('daily')}
                                        className="w-full py-3 bg-quirky-green border-3 border-black rounded-xl font-heading shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>YES, ADD FOR ALL DAYS</span>
                                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => handleUpsellChoice('once')}
                                    className="w-full py-3 bg-quirky-yellow border-3 border-black rounded-xl font-heading shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                                >
                                    JUST TRY ONCE (₹{kefirAddon.price})
                                </button>

                                <button
                                    onClick={() => handleUpsellChoice('skip')}
                                    className="w-full py-2 text-gray-400 font-heading text-sm hover:text-black underline"
                                >
                                    No thanks, I hate good bacteria
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto relative z-10">

                {/* === STEP 1: THE BUILD === */}
                {currentStep === 1 && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="font-heading text-3xl md:text-5xl bg-white border-4 border-black inline-block px-8 py-3 shadow-hard">BUILD THE PLAN 🛠️</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start relative">
                            {/* LEFT COLUMN: SELECTIONS */}
                            <div className="md:col-span-2 space-y-6 md:space-y-8">
                                {/* Plan Type Selection */}
                                <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                                    <h3 className="font-heading text-lg md:text-xl mb-4">CHOOSE YOUR FIGHTER</h3>

                                    {loadingMenu ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                                            <p className="font-heading text-sm">Curating the best for you...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Main Tabs (Plans) */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                                                {plans.map((plan, index) => (
                                                    <button
                                                        key={plan.id}
                                                        onClick={() => {
                                                            setCurrentPlanIndex(index);
                                                            if (plan.items && plan.items.length > 0) {
                                                                setSelectedItem(plan.items[0]);
                                                            }
                                                        }}
                                                        className={`py-3 md:py-4 border-3 border-black rounded-xl font-heading text-lg md:text-xl transition-all uppercase ${index === currentPlanIndex ? 'bg-quirky-yellow shadow-hard -rotate-1' : 'bg-white shadow-sm hover:shadow-hard hover:-translate-y-1'}`}
                                                    >
                                                        {plan.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Dynamic Content (Items in selected Plan) */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
                                                {plans[currentPlanIndex]?.items?.map((item: any) => {
                                                    const isSelected = selectedItem?.id === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => setSelectedItem(item)}
                                                            className={`relative group w-full h-48 rounded-2xl overflow-hidden border-4 transition-all duration-300 ${isSelected ? 'border-quirky-yellow shadow-hard -translate-y-1 scale-[1.02] rotate-1 z-10' : 'border-black hover:shadow-hard hover:-translate-y-1'}`}
                                                        >
                                                            {/* Background Image */}
                                                            <div className="absolute inset-0">
                                                                <img
                                                                    src={getImageUrl(item.name, item.image)}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                                {/* Dark Gradient Overlay - Always Dark for Contrast */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                                            </div>

                                                            {/* Content Overlay */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                                                                <div className="flex justify-between items-end">
                                                                    <div>
                                                                        <h4 className="font-heading text-xl uppercase leading-none mb-1 text-white drop-shadow-md">{item.name}</h4>
                                                                        {item.proteinAmount > 0 && <p className="text-white/90 text-xs font-bold">{item.proteinAmount}g PROTEIN</p>}
                                                                    </div>
                                                                    <div className={`px-2 py-1 rounded font-bold text-sm shadow-[2px_2px_0_0_#000] ${isSelected ? 'bg-white text-black' : 'bg-quirky-yellow text-black'}`}>
                                                                        ₹{item.price}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Selected Indicator */}
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 bg-quirky-yellow text-black rounded-full p-1 border-2 border-black shadow-sm animate-in zoom-in spin-in-12 duration-300">
                                                                    <Check size={20} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                                {(!plans[currentPlanIndex]?.items || plans[currentPlanIndex].items.length === 0) && (
                                                    <p className="col-span-2 text-center text-gray-400 font-heading py-8">No items in this plan yet.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* --- RIGHT COLUMN: LIVE SUMMARY (Desktop Sticky) --- */}
                            <div className="md:col-span-1">
                                <div className="sticky top-24 bg-white border-4 border-black p-6 rounded-3xl shadow-hard-xl">
                                    <h3 className="font-heading text-xl mb-4 border-b-4 border-black pb-2">YOUR STASH 🛒</h3>

                                    {/* Plan Details */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-heading text-lg">{selectedItem?.name || 'SELECT PLAN'}</span>
                                            <span className="font-bold">₹{basePlanTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 font-body">
                                            {days} Days • {mealsPerDay} Meal{mealsPerDay > 1 ? 's' : ''}/Day
                                        </div>
                                    </div>

                                    {/* Add-ons List */}
                                    {Object.keys(addons).length > 0 && (
                                        <div className="mb-4 border-t-2 border-dashed border-gray-300 pt-4">
                                            <p className="font-heading text-sm text-gray-400 mb-2">EXTRAS</p>
                                            <div className="space-y-2">
                                                {Object.keys(addons).map(key => {
                                                    const def = availableAddons.find(a => a.id.toString() === key);
                                                    const item = addons[key];

                                                    if (!def || item.quantity === 0) return null;

                                                    const lineTotal = item.frequency === 'daily' ? def.price * item.quantity * days : def.price * item.quantity;

                                                    return (
                                                        <div key={key} className="flex justify-between text-sm">
                                                            <div>
                                                                <span className="font-bold">{def.name}</span>
                                                                <span className="text-xs text-gray-500 block">x{item.quantity} ({item.frequency})</span>
                                                            </div>
                                                            <span className="font-bold">₹{lineTotal}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivery Fee Logic */}
                                    <div className="mb-6 border-t-2 border-dashed border-gray-300 pt-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-heading text-sm">DELIVERY FEE 🛵</span>
                                            <span className="font-bold">₹{
                                                days <= 5 ? 50 * days : 300
                                            }</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {days <= 5 ? `Short term rate (₹50 x ${days} days)` : 'Standard Flat Rate (Fixed)'}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="bg-quirky-cream border-3 border-black p-4 rounded-xl flex justify-between items-center">
                                        <span className="font-heading text-lg">TOTAL</span>
                                        <span className="font-heading text-2xl text-quirky-green text-stroke-sm">
                                            ₹{(
                                                basePlanTotal +
                                                Object.keys(addons).reduce((sum, key) => {
                                                    const item = addons[key];
                                                    const def = availableAddons.find(a => a.id.toString() === key);
                                                    if (!def) return sum;
                                                    return sum + (item.frequency === 'daily' ? def.price * item.quantity * days : def.price * item.quantity);
                                                }, 0) +
                                                (days <= 5 ? 50 * days : 300)
                                            ).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="mt-6 text-center text-xs text-gray-400">
                                        *Final bill shown at next step
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Duration Selection & Addons Below */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Duration Selection */}
                            <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-heading text-lg md:text-xl">DURATION</h3>
                                    <span className="font-heading text-xl md:text-2xl text-quirky-blue">{days} DAYS</span>
                                </div>

                                {/* Custom Slider for Stops [1, 7, 14, 24, 30] */}
                                <div className="mb-8 px-2 relative">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="1"
                                        value={days}
                                        onChange={(e) => setDays(parseInt(e.target.value))}
                                        className="w-full h-4 accent-quirky-pink cursor-pointer"
                                    />
                                    {/* Tick Marks / Labels */}
                                    <div className="relative w-full h-6 mt-2 font-heading text-xs text-gray-500">
                                        <span className="absolute left-0 -translate-x-1/2" style={{ left: '0%' }}>1</span>
                                        <span className="absolute left-0 -translate-x-1/2" style={{ left: '20.6%' }}>7</span>
                                        <span className="absolute left-0 -translate-x-1/2" style={{ left: '44.8%' }}>14</span>
                                        <span className="absolute left-0 -translate-x-1/2" style={{ left: '79.3%' }}>24</span>
                                        <span className="absolute right-0 translate-x-1/2 md:translate-x-0" style={{ left: '100%' }}>30</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                                    <button onClick={() => setMealsPerDay(1)} className={`py-3 border-3 border-black rounded-xl font-heading text-sm md:text-base ${mealsPerDay === 1 ? 'bg-quirky-green' : 'bg-white'}`}>JUST LUNCH</button>
                                    <button onClick={() => setMealsPerDay(2)} className={`py-3 border-3 border-black rounded-xl font-heading text-sm md:text-base ${mealsPerDay === 2 ? 'bg-quirky-green' : 'bg-white'}`}>LUNCH & DINNER</button>
                                </div>

                                <div className="mb-2">
                                    <h3 className="font-heading text-lg md:text-xl mb-2">START DATE</h3>
                                    <input
                                        type="date"
                                        value={startDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full border-3 border-black p-3 rounded-xl font-heading focus:bg-pink-50 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Add-ons */}
                            <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                                <h3 className="font-heading text-lg md:text-xl mb-4">EXTRAS & BOOSTERS 🥤</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {availableAddons.map(addon => {
                                        const addonId = addon.id.toString();
                                        const sel = addons[addonId] || { quantity: 0, frequency: 'once' };
                                        const imgUrl = getAddonImageUrl(addon.name, (addon as any).thumbnail || addon.image);
                                        const isSelected = sel.quantity > 0;

                                        return (
                                            <div key={addonId} className={`relative flex flex-col border-3 rounded-2xl overflow-hidden transition-all duration-200 ${isSelected ? 'border-quirky-green shadow-hard -translate-y-1 bg-green-50' : 'border-gray-200 bg-white hover:border-black'}`}>
                                                {/* Addon Image Area */}
                                                <div className="h-24 w-full relative bg-gray-100 border-b-3 border-black/10">
                                                    <img src={imgUrl} alt={addon.name} className="w-full h-full object-cover" />
                                                    {addon.price && <span className="absolute bottom-1 right-1 bg-white/90 backdrop-blur text-black text-xs font-bold px-1.5 py-0.5 rounded border border-black/20">₹{addon.price}</span>}
                                                </div>

                                                {/* Content */}
                                                <div className="p-3 flex flex-col flex-1">
                                                    <h4 className="font-heading text-sm md:text-base leading-tight mb-1">{addon.name}</h4>

                                                    {/* Controls */}
                                                    <div className="mt-auto pt-2 flex items-center justify-between">
                                                        {isSelected ? (
                                                            <div className="flex items-center gap-2 w-full justify-between">
                                                                <button onClick={(e) => { e.stopPropagation(); updateAddon(addonId, -1, sel.frequency); }} className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded hover:bg-red-50 text-red-500"><Minus size={14} strokeWidth={3} /></button>
                                                                <span className="font-heading text-lg">{sel.quantity}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); handleAddonClick(addon); }} className="w-8 h-8 flex items-center justify-center bg-quirky-green border-2 border-black rounded hover:bg-green-400"><Plus size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleAddonClick(addon)} className="w-full py-1.5 bg-gray-100 hover:bg-quirky-yellow border-2 border-transparent hover:border-black rounded-lg font-heading text-xs transition-colors flex items-center justify-center gap-1 group">
                                                                <span>ADD</span> <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Frequency Badge */}
                                                    {isSelected && addon.allowSubscription && (
                                                        <div className="mt-2 text-center">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-black/50 ${sel.frequency === 'daily' ? 'bg-quirky-purple text-white' : 'bg-white text-gray-500'}`}>
                                                                {sel.frequency === 'daily' ? 'EVERY DAY' : 'JUST ONCE'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                            <h3 className="font-heading text-lg md:text-xl mb-4">SPECIAL INSTRUCTIONS 📝</h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Less spice? No cilantro? Let the chef know..."
                                className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-quirky-yellow/20 outline-none h-24 resize-none transition-colors"
                            />
                        </div>
                    </div>



                )}

                {/* === STEP 2: THE DROP (DETAILS & MAP) === */}
                {
                    currentStep === 2 && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="text-center mb-6 md:mb-8">
                                <h2 className="font-heading text-2xl md:text-4xl bg-white border-3 border-black inline-block px-6 py-2 shadow-hard -rotate-1">DROP THE PIN 📍</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {/* Form */}
                                <div className="space-y-4">
                                    <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                                        <h3 className="font-heading text-lg mb-4">WHO'S EATING?</h3>
                                        <input
                                            placeholder="FULL NAME" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full border-3 border-black p-3 rounded-xl font-heading mb-3 focus:bg-pink-50 outline-none"
                                        />
                                        <input
                                            placeholder="PHONE NUMBER" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full border-3 border-black p-3 rounded-xl font-heading mb-3 focus:bg-blue-50 outline-none"
                                        />
                                        <input
                                            placeholder="EMAIL" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                            className="w-full border-3 border-black p-3 rounded-xl font-heading mb-3 focus:bg-yellow-50 outline-none"
                                        />
                                        <textarea
                                            placeholder="FLAT NO / BUILDING / LANDMARK" rows={3} value={form.flatDetails} onChange={e => setForm({ ...form, flatDetails: e.target.value })}
                                            className="w-full border-3 border-black p-3 rounded-xl font-heading focus:bg-green-50 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="bg-quirky-yellow border-3 border-black p-4 rounded-2xl flex gap-3 items-center">
                                        <div className="bg-black text-white p-2 rounded-full shrink-0"><Navigation size={20} /></div>
                                        <p className="font-heading text-sm leading-tight">Drag the marker on the map to exact delivery spot!</p>
                                    </div>
                                </div>

                                {/* Map Container */}
                                <div className="bg-white border-4 border-black rounded-3xl h-[300px] md:h-[400px] shadow-hard-xl overflow-hidden relative group">
                                    {!window.google && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-6 text-center z-10">
                                            <MapPin size={48} className="text-gray-400 mb-2" />
                                            <p className="font-heading">MAP LOADING...</p>
                                            <p className="text-xs text-gray-500">(If it stays stuck, add your API Key in code)</p>
                                        </div>
                                    )}
                                    <div ref={mapRef} className="w-full h-full" id="map"></div>
                                    {location && (
                                        <div className={`absolute bottom-4 left-4 right-4 border-3 p-2 rounded-xl text-center font-heading text-xs shadow-md ${isInZone === false ? 'bg-red-100 border-red-500 text-red-700' : isInZone === true ? 'bg-green-100 border-green-600 text-green-700' : 'bg-white border-black'}`}>
                                            {isInZone === false && (
                                                <span>❌ Outside delivery zone ({distanceFromOutlet}km away) • Max: {serviceArea?.serviceRadiusKm}km</span>
                                            )}
                                            {isInZone === true && (
                                                <span>✅ You're in our delivery zone! ({distanceFromOutlet}km away)</span>
                                            )}
                                            {isInZone === null && (
                                                <span>LAT: {location.lat.toFixed(4)}, LNG: {location.lng.toFixed(4)}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Location Permission Modal - Blocking */}
                                    {locationPermission === 'denied' && (
                                        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                                            <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm text-center border-4 border-red-500 animate-bounce-in">
                                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <MapPin className="text-red-500" size={32} />
                                                </div>
                                                <h3 className="font-heading text-xl text-slate-900 mb-2">Location Required!</h3>
                                                <p className="text-sm text-slate-600 mb-6">
                                                    We need your exact location to check if we can deliver to you. Please enable location access in your browser settings.
                                                </p>
                                                <button
                                                    onClick={() => window.location.reload()}
                                                    className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 w-full shadow-lg transform active:scale-95 transition-transform"
                                                >
                                                    Reload to Enable
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* === STEP 3: THE DAMAGE (BILL) === */}
                {
                    currentStep === 3 && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="text-center mb-6 md:mb-8">
                                <h2 className="font-heading text-2xl md:text-4xl bg-white border-3 border-black inline-block px-6 py-2 shadow-hard rotate-1">THE DAMAGE 💸</h2>
                            </div>

                            <div className="max-w-md mx-auto bg-white border-4 border-black p-0 rounded-3xl shadow-hard-xl overflow-hidden relative">
                                {/* Receipt Jagged Edge Top */}
                                <div className="bg-quirky-black h-4 w-full"></div>

                                <div className="p-6 md:p-8">
                                    <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                                        <div>
                                            <h3 className="font-heading text-xl md:text-2xl">{selectedItem?.name} PLAN</h3>
                                            <p className="font-body text-gray-500 text-sm">{days} Days • {mealsPerDay} Meal/Day</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-heading text-lg md:text-xl">₹{basePlanTotal.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Addon Breakdown */}
                                    {Object.keys(addons).length > 0 && (
                                        <div className="mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                                            <p className="font-heading text-sm text-gray-400 mb-2">EXTRAS</p>
                                            {Object.keys(addons).map(key => {
                                                const item = addons[key];
                                                const def = availableAddons.find(a => a.id.toString() === key);
                                                if (!def || item.quantity === 0) return null;
                                                const lineTotal = item.frequency === 'daily' ? def.price * item.quantity * days : def.price * item.quantity;
                                                return (
                                                    <div key={key} className="flex justify-between text-sm font-body mb-1">
                                                        <span>{def.name} x{item.quantity} ({item.frequency})</span>
                                                        <span className="font-bold">₹{lineTotal}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {deliveryFee > 0 && (
                                        <div className="flex justify-between items-center mb-6 text-sm font-body text-gray-600">
                                            <span>Delivery Fee</span>
                                            <span>₹{deliveryFee}</span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="bg-quirky-cream border-3 border-black p-4 rounded-xl flex justify-between items-center mb-8">
                                        <span className="font-heading text-base md:text-lg">TOTAL TO PAY</span>
                                        <span className="font-heading text-2xl md:text-3xl text-quirky-green text-stroke-sm">₹{grandTotal.toLocaleString()}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                                            <MapPin size={16} className="shrink-0" />
                                            <p className="line-clamp-2">{form.flatDetails}, (Lat: {location?.lat.toFixed(2)}, Lng: {location?.lng.toFixed(2)})</p>
                                        </div>

                                        <QuirkyButton onClick={handleConfirmOrder} disabled={loading} className="w-full text-lg md:text-xl py-4 flex items-center justify-center gap-2">
                                            <Check size={24} /> {loading ? 'CONFIRMING...' : 'LOCK IT IN'}
                                        </QuirkyButton>
                                    </div>
                                </div>

                                {/* Receipt Jagged Edge Bottom */}
                                <div className="bg-white h-4 w-full absolute bottom-0" style={{ backgroundImage: 'linear-gradient(135deg, transparent 50%, black 50%), linear-gradient(45deg, black 50%, transparent 50%)', backgroundSize: '20px 20px' }}></div>
                            </div>
                        </div>
                    )
                }

            </div>

            {/* Action Buttons (Footer for Step 1 & 2) */}
            {
                currentStep < 3 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-4 z-40 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
                        <div className="max-w-4xl mx-auto flex justify-between items-center">
                            <div>
                                <p className="font-heading text-[10px] md:text-xs text-gray-400">ESTIMATED TOTAL</p>
                                <p className="font-heading text-xl md:text-3xl">₹{grandTotal.toLocaleString()}</p>
                            </div>
                            <QuirkyButton onClick={nextStep} className="px-6 py-2 md:px-8 md:py-3 text-base md:text-lg">
                                {currentStep === 1 ? 'NEXT: LOCATION 📍' : 'NEXT: BILL 🧾'}
                            </QuirkyButton>
                        </div>
                    </div>
                )
            }



            {/* --- ADDON POPUP MODAL --- */}
            {
                activeAddonModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white border-4 border-black p-6 rounded-3xl max-w-sm w-full shadow-hard-xl relative transform -rotate-1">
                            <button onClick={() => setActiveAddonModal(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full border-2 border-transparent hover:border-black transition-all"><X size={20} /></button>

                            <h3 className="font-heading text-2xl mb-2 text-center text-stroke-sm text-quirky-pink">ADD {activeAddonModal.name}</h3>
                            <p className="text-center text-gray-500 mb-6 font-body text-sm font-bold">{activeAddonModal.desc}</p>

                            <div className="space-y-4">
                                <button onClick={() => handleModalSelection('once')} className="w-full border-3 border-black p-4 rounded-xl font-heading hover:bg-quirky-yellow hover:shadow-hard transition-all flex justify-between items-center group active:scale-95">
                                    <span className="text-lg">JUST ONCE</span>
                                    <span className="text-xs bg-black text-white px-2 py-1 rounded">₹{activeAddonModal.price}</span>
                                </button>

                                <div className="relative">
                                    <div className="absolute -top-3 -right-2 bg-quirky-green text-black border border-black text-[10px] px-2 py-0.5 rounded rotate-3 z-10 font-bold">RECOMMENDED</div>
                                    <button onClick={() => handleModalSelection('daily')} className="w-full border-3 border-black p-4 rounded-xl font-heading hover:bg-quirky-purple hover:text-white hover:shadow-hard transition-all flex justify-between items-center bg-gray-50 group active:scale-95">
                                        <div className="text-left">
                                            <span className="block text-lg">EVERY DAY</span>
                                            <span className="text-[10px] opacity-70 font-bold block">With your {days} day plan</span>
                                        </div>
                                        <span className="text-xs bg-black text-white px-2 py-1 rounded">₹{activeAddonModal.price * days}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};