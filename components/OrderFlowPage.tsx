import React, { useState, useEffect, useRef } from 'react';
import { BASE_RATES, SUBSCRIPTION_RATES, ADD_ONS, DELIVERY_FEE_MONTHLY } from '../constants';
import { ProteinType, AddOnSelection, AddOn } from '../types';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Check, Plus, Minus, MapPin, Navigation, Receipt, LayoutList, X } from 'lucide-react';

interface OrderFlowPageProps {
  onBack: () => void;
}

// Global Definitions
declare global {
  interface Window {
    Razorpay: any;
    google: any;
  }
}

export const OrderFlowPage: React.FC<OrderFlowPageProps> = ({ onBack }) => {
  // --- Wizard State ---
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // --- Step 1: Selection State ---
  const [days, setDays] = useState<number>(24);
  const [mealsPerDay, setMealsPerDay] = useState<number>(1);
  const [protein, setProtein] = useState<ProteinType>(ProteinType.CHICKEN);
  const [addons, setAddons] = useState<Record<string, AddOnSelection>>({});
  
  // --- Addon Modal State ---
  const [activeAddonModal, setActiveAddonModal] = useState<AddOn | null>(null);

  // --- Step 2: Details & Map State ---
  const [form, setForm] = useState({ name: '', phone: '', email: '', flatDetails: '' });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // --- Calculations ---
  const [basePlanTotal, setBasePlanTotal] = useState<number>(0);

  useEffect(() => {
    let rate = BASE_RATES[protein];
    if (days >= 24) rate = SUBSCRIPTION_RATES[protein];
    else if (days >= 6) rate = rate * 0.95; 
    setBasePlanTotal(Math.round(rate * days * mealsPerDay));
  }, [days, mealsPerDay, protein]);

  const calculateAddonTotal = () => {
    let total = 0;
    Object.keys(addons).forEach(key => {
        const selection = addons[key];
        const addonDef = ADD_ONS.find(a => a.id === key);
        if (addonDef && selection.quantity > 0) {
            const price = addonDef.price;
            if (selection.frequency === 'daily') total += price * selection.quantity * days;
            else total += price * selection.quantity;
        }
    });
    return total;
  };

  const deliveryFee = days >= 24 ? DELIVERY_FEE_MONTHLY : 0;
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
      // If adding from 0 and it allows subscription, show modal to ask "Once" or "Daily"
      if (currentQty === 0 && addon.allowSubscription) {
          setActiveAddonModal(addon);
      } else {
          // If already added or no subscription option, just increment default
          const currentFreq = addons[addon.id]?.frequency || 'once';
          updateAddon(addon.id, 1, currentFreq);
      }
  };

  const handleModalSelection = (frequency: 'once' | 'daily') => {
      if (activeAddonModal) {
          updateAddon(activeAddonModal.id, 1, frequency);
          setActiveAddonModal(null);
      }
  };

  // --- Map Logic ---
  useEffect(() => {
    if (currentStep === 2 && window.google && mapRef.current && !googleMapInstance.current) {
        // Default to Pune/India or generic location if geolocation fails
        const defaultPos = { lat: 18.6298, lng: 73.7997 }; 

        googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
            center: defaultPos,
            zoom: 15,
            styles: [
                // Funky Map Style (Yellow roads, quirky colors)
                { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#facc15" }] },
                { "featureType": "water", "stylers": [{ "color": "#60a5fa" }] },
                { "featureType": "landscape", "stylers": [{ "color": "#fefce8" }] }
            ],
            disableDefaultUI: true,
            zoomControl: true,
        });

        markerInstance.current = new window.google.maps.Marker({
            position: defaultPos,
            map: googleMapInstance.current,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
            title: "Your Healthy Food Spot"
        });

        setLocation(defaultPos);

        // Listen for drag
        markerInstance.current.addListener("dragend", () => {
            const pos = markerInstance.current.getPosition();
            setLocation({ lat: pos.lat(), lng: pos.lng() });
        });

        // Click map to move marker
        googleMapInstance.current.addListener("click", (e: any) => {
            markerInstance.current.setPosition(e.latLng);
            setLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        // Try to get actual location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                googleMapInstance.current.setCenter(pos);
                markerInstance.current.setPosition(pos);
                setLocation(pos);
            });
        }
    }
  }, [currentStep]);


  const processPayment = () => {
    if (!window.Razorpay) { alert("Razorpay SDK missing."); return; }

    const options = {
        key: "YOUR_RAZORPAY_KEY", 
        amount: grandTotal * 100, 
        currency: "INR",
        name: "The Healthy Canteen",
        description: `${days}D ${protein} Plan`,
        handler: function (response: any) {
            alert(`Payment ID: ${response.razorpay_payment_id}. Welcome to the club!`);
            onBack();
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#a3e635" }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const nextStep = () => {
      if (currentStep === 1) setCurrentStep(2);
      else if (currentStep === 2) {
          if (!form.name || !form.phone) {
              alert("Hey! We need your name and phone at least.");
              return;
          }
          if (!location) {
             alert("Drop a pin on the map so we know where to go!");
             return;
          }
          setCurrentStep(3);
      }
  };

  const prevStep = () => {
      if (currentStep === 1) onBack();
      else setCurrentStep(prev => (prev - 1) as 1 | 2);
  };

  // --- Render Steps ---

  const renderProgressBar = () => (
      <div className="flex justify-center mb-6 md:mb-8 px-4">
          <div className="flex items-center gap-2 md:gap-4">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-heading border-3 border-black transition-all text-sm md:text-base ${currentStep >= 1 ? 'bg-quirky-yellow text-black' : 'bg-gray-200 text-gray-400'}`}>1</div>
              <div className={`h-1 w-6 md:w-16 border-t-4 border-black border-dashed ${currentStep >= 2 ? 'border-black' : 'border-gray-300'}`}></div>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-heading border-3 border-black transition-all text-sm md:text-base ${currentStep >= 2 ? 'bg-quirky-pink text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <div className={`h-1 w-6 md:w-16 border-t-4 border-black border-dashed ${currentStep >= 3 ? 'border-black' : 'border-gray-300'}`}></div>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-heading border-3 border-black transition-all text-sm md:text-base ${currentStep >= 3 ? 'bg-quirky-green text-black' : 'bg-gray-200 text-gray-400'}`}>3</div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-quirky-cream pt-20 pb-44 md:pb-32 px-4 md:px-8 relative">
      
      {/* Nav */}
      <nav className="fixed top-4 left-4 z-50">
        <button onClick={prevStep} className="bg-white border-3 border-black p-2 md:p-3 rounded-full shadow-hard hover:scale-110 transition-transform">
            <ArrowLeft size={20} />
        </button>
      </nav>

      {renderProgressBar()}

      <div className="max-w-4xl mx-auto">
        
        {/* === STEP 1: THE BUILD === */}
        {currentStep === 1 && (
            <div className="animate-in slide-in-from-right duration-300">
                <div className="text-center mb-6 md:mb-8">
                    <h2 className="font-heading text-2xl md:text-4xl bg-white border-3 border-black inline-block px-6 py-2 shadow-hard rotate-1">BUILD THE PLAN 🛠️</h2>
                </div>

                <div className="space-y-6 md:space-y-8">
                    {/* Protein */}
                    <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                        <h3 className="font-heading text-lg md:text-xl mb-4">CHOOSE YOUR FUEL</h3>
                        <div className="flex gap-3 md:gap-4">
                            <button onClick={() => setProtein(ProteinType.CHICKEN)} className={`flex-1 py-3 md:py-4 border-3 border-black rounded-xl font-heading text-lg md:text-xl transition-all ${protein === ProteinType.CHICKEN ? 'bg-quirky-yellow shadow-hard translate-x-1 translate-y-1' : 'bg-gray-50'}`}>🐔 CHICKEN</button>
                            <button onClick={() => setProtein(ProteinType.PANEER)} className={`flex-1 py-3 md:py-4 border-3 border-black rounded-xl font-heading text-lg md:text-xl transition-all ${protein === ProteinType.PANEER ? 'bg-quirky-pink text-white shadow-hard translate-x-1 translate-y-1' : 'bg-gray-50'}`}>🧀 PANEER</button>
                        </div>
                    </div>

                    {/* Days Slider */}
                    <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-heading text-lg md:text-xl">DURATION</h3>
                            <span className="font-heading text-xl md:text-2xl text-quirky-blue">{days} DAYS</span>
                        </div>
                        <input type="range" min="1" max="30" value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full h-4 mb-8" />
                        
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                             <button onClick={() => setMealsPerDay(1)} className={`py-3 border-3 border-black rounded-xl font-heading text-sm md:text-base ${mealsPerDay === 1 ? 'bg-quirky-green' : 'bg-white'}`}>JUST LUNCH</button>
                             <button onClick={() => setMealsPerDay(2)} className={`py-3 border-3 border-black rounded-xl font-heading text-sm md:text-base ${mealsPerDay === 2 ? 'bg-quirky-green' : 'bg-white'}`}>LUNCH & DINNER</button>
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div className="bg-white border-4 border-black p-4 md:p-6 rounded-3xl shadow-hard">
                         <h3 className="font-heading text-lg md:text-xl mb-4">EXTRAS & BOOSTERS 🥤</h3>
                         {ADD_ONS.map(addon => {
                             const sel = addons[addon.id] || { quantity: 0, frequency: 'once' };
                             return (
                                 <div key={addon.id} className="flex flex-row justify-between items-center border-b-2 border-dashed border-gray-300 py-4 last:border-0 gap-3">
                                     <div className="flex-1 min-w-0 pr-2">
                                         <p className="font-heading text-sm md:text-base leading-tight break-words">{addon.name}</p>
                                         <p className="font-body text-xs text-gray-500 font-bold mt-1">₹{addon.price}</p>
                                         {/* Show active mode */}
                                         {sel.quantity > 0 && addon.allowSubscription && (
                                             <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 border border-black ${sel.frequency === 'daily' ? 'bg-quirky-purple text-white' : 'bg-gray-100'}`}>
                                                 {sel.frequency === 'daily' ? 'EVERY DAY' : 'JUST ONCE'}
                                             </span>
                                         )}
                                     </div>
                                     <div className="flex items-center gap-2 shrink-0">
                                         {sel.quantity > 0 && (
                                            <>
                                                <button onClick={() => updateAddon(addon.id, -1, sel.frequency)} className="w-8 h-8 flex items-center justify-center bg-red-100 border-2 border-black rounded shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"><Minus size={14} /></button>
                                                <span className="font-heading w-6 text-center text-sm">{sel.quantity}</span>
                                            </>
                                         )}
                                         <button onClick={() => handleAddonClick(addon)} className="w-8 h-8 flex items-center justify-center bg-quirky-green border-2 border-black rounded shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"><Plus size={14} /></button>
                                     </div>
                                 </div>
                             );
                         })}
                    </div>
                </div>
            </div>
        )}

        {/* === STEP 2: THE DROP (DETAILS & MAP) === */}
        {currentStep === 2 && (
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
                                placeholder="FULL NAME" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full border-3 border-black p-3 rounded-xl font-heading mb-3 focus:bg-pink-50 outline-none"
                            />
                            <input 
                                placeholder="PHONE NUMBER" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                                className="w-full border-3 border-black p-3 rounded-xl font-heading mb-3 focus:bg-blue-50 outline-none"
                            />
                            <input 
                                placeholder="EMAIL" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full border-3 border-black p-3 rounded-xl font-heading mb-3 focus:bg-yellow-50 outline-none"
                            />
                             <textarea 
                                placeholder="FLAT NO / BUILDING / LANDMARK" rows={3} value={form.flatDetails} onChange={e => setForm({...form, flatDetails: e.target.value})}
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
                             <div className="absolute bottom-4 left-4 right-4 bg-white border-3 border-black p-2 rounded-xl text-center font-heading text-xs shadow-md">
                                 LAT: {location.lat.toFixed(4)}, LNG: {location.lng.toFixed(4)}
                             </div>
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* === STEP 3: THE DAMAGE (BILL) === */}
        {currentStep === 3 && (
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
                                <h3 className="font-heading text-xl md:text-2xl">{protein} PLAN</h3>
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
                                    const def = ADD_ONS.find(a => a.id === key);
                                    if(!def || item.quantity === 0) return null;
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

                            <QuirkyButton onClick={processPayment} className="w-full text-lg md:text-xl py-4 flex items-center justify-center gap-2">
                                <Check size={24} /> LOCK IT IN
                            </QuirkyButton>
                        </div>
                    </div>
                    
                    {/* Receipt Jagged Edge Bottom */}
                    <div className="bg-white h-4 w-full absolute bottom-0" style={{ backgroundImage: 'linear-gradient(135deg, transparent 50%, black 50%), linear-gradient(45deg, black 50%, transparent 50%)', backgroundSize: '20px 20px' }}></div>
                </div>
            </div>
        )}

        {/* Action Buttons (Footer for Step 1 & 2) */}
        {currentStep < 3 && (
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
        )}

      </div>

      {/* --- ADDON POPUP MODAL --- */}
      {activeAddonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border-4 border-black p-6 rounded-3xl max-w-sm w-full shadow-hard-xl relative transform -rotate-1">
                 <button onClick={() => setActiveAddonModal(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full border-2 border-transparent hover:border-black transition-all"><X size={20}/></button>
                 
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
      )}

    </div>
  );
};