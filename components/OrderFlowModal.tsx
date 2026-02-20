import React, { useState, useEffect } from 'react';
import { BASE_RATES, ADD_ONS } from '../constants';
import { ProteinType, AddOnSelection } from '../types';
import { QuirkyButton } from './QuirkyButton';
import { X, Plus, Minus, CheckCircle, Zap } from 'lucide-react';
import { orders } from '../src/services/api';

interface OrderFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Razorpay type definition
declare global {
    interface Window {
        Razorpay: any;
    }
}

export const OrderFlowModal: React.FC<OrderFlowModalProps> = ({ isOpen, onClose }) => {
    // --- Plan State ---
    const [days, setDays] = useState<number>(6);
    const [mealsPerDay, setMealsPerDay] = useState<number>(1);
    const [protein, setProtein] = useState<ProteinType>(ProteinType.CHICKEN);
    const [basePlanTotal, setBasePlanTotal] = useState<number>(0);

    // --- Addon State ---
    const [addons, setAddons] = useState<Record<string, AddOnSelection>>({});

    // --- Form State ---
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

    // Slider stops
    const stops = [1, 6, 12, 24];

    // --- Calculations ---
    useEffect(() => {
        const baseRate = BASE_RATES[protein];
        let multiplier = 1;

        // Bulk discounts logic
        if (days >= 24) multiplier = 0.85; // 15% off
        else if (days >= 14) multiplier = 0.90; // 10% off
        else if (days >= 6) multiplier = 0.95; // 5% off

        const calculatedPrice = Math.round(baseRate * days * mealsPerDay * multiplier);
        setBasePlanTotal(calculatedPrice);
    }, [days, mealsPerDay, protein]);

    const calculateAddonTotal = () => {
        let total = 0;
        Object.keys(addons).forEach(key => {
            const selection = addons[key];
            const addonDef = ADD_ONS.find(a => a.id === key);
            if (addonDef && selection.quantity > 0) {
                const price = addonDef.price;
                if (selection.frequency === 'daily') {
                    total += price * selection.quantity * days;
                } else {
                    total += price * selection.quantity;
                }
            }
        });
        return total;
    };

    const grandTotal = basePlanTotal + calculateAddonTotal();

    // --- Handlers ---
    const updateAddon = (id: string, quantity: number, frequency: 'once' | 'daily' = 'once') => {
        setAddons(prev => ({
            ...prev,
            [id]: { quantity, frequency }
        }));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check auth
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please login to place an order!");
            // In a real app, redirect to auth
            return;
        }

        try {
            const payload = {
                protein,
                days,
                mealsPerDay,
                startDate: new Date().toISOString() // Or simpler date string
            };

            // Call Backend
            await orders.create(payload);

            alert("Order success! Welcome to the club.");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to place order. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-quirky-cream border-4 border-black w-full max-w-5xl h-[90vh] shadow-hard-xl relative flex flex-col rounded-3xl overflow-hidden">

                {/* Header */}
                <div className="bg-quirky-black text-white p-4 md:p-6 flex justify-between items-center shrink-0">
                    <h2 className="font-heading text-2xl md:text-4xl text-quirky-green">CONSTRUCT YOUR GAINS 🏗️</h2>
                    <button onClick={onClose} className="p-2 bg-white text-black border-2 border-transparent hover:bg-red-400 hover:border-black rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* COLUMN 1: BUILDER */}
                        <div className="space-y-10">

                            {/* SECTION 1: PROTEIN */}
                            <section className="bg-white border-3 border-black p-6 rounded-2xl shadow-hard relative">
                                <div className="absolute -top-4 -left-2 bg-quirky-pink text-white font-heading px-3 py-1 border-2 border-black -rotate-2">STEP 1</div>
                                <h3 className="font-heading text-xl mb-4 mt-2">CHOOSE FUEL SOURCE</h3>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setProtein(ProteinType.CHICKEN)}
                                        className={`flex-1 py-4 border-3 border-black rounded-xl font-heading text-lg transition-all ${protein === ProteinType.CHICKEN ? 'bg-quirky-yellow shadow-hard translate-x-1 translate-y-1' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        🐔 CHICKEN
                                    </button>
                                    <button
                                        onClick={() => setProtein(ProteinType.PANEER)}
                                        className={`flex-1 py-4 border-3 border-black rounded-xl font-heading text-lg transition-all ${protein === ProteinType.PANEER ? 'bg-quirky-pink text-white shadow-hard translate-x-1 translate-y-1' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        🧀 PANEER
                                    </button>
                                </div>
                            </section>

                            {/* SECTION 2: DAYS */}
                            <section className="bg-white border-3 border-black p-6 rounded-2xl shadow-hard relative">
                                <div className="absolute -top-4 -left-2 bg-quirky-blue text-white font-heading px-3 py-1 border-2 border-black rotate-1">STEP 2</div>
                                <h3 className="font-heading text-xl mb-6 mt-2">DURATION: {days} DAYS</h3>

                                <div className="relative px-2 pt-6 pb-10">
                                    {/* Markers */}
                                    <div className="absolute top-0 left-0 right-0 flex justify-between px-2 font-heading text-[10px] md:text-xs text-gray-400">
                                        {stops.map(stop => (
                                            <div
                                                key={stop}
                                                className="flex flex-col items-center cursor-pointer hover:text-black transition-colors"
                                                style={{
                                                    left: `calc(12px + ${((stop - 1) / 23)} * (100% - 24px))`,
                                                    position: 'absolute',
                                                    transform: 'translateX(-50%)'
                                                }}
                                                onClick={() => setDays(stop)}
                                            >
                                                <div className={`w-3 h-3 border-2 border-black rounded-full mb-2 ${days >= stop ? 'bg-quirky-green' : 'bg-white'}`}></div>
                                                {stop}D
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="24"
                                        value={days}
                                        onChange={(e) => setDays(parseInt(e.target.value))}
                                        className="w-full relative z-10 accent-quirky-black"
                                    />
                                </div>

                                <h3 className="font-heading text-xl mb-4">MEALS PER DAY</h3>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setMealsPerDay(1)}
                                        className={`flex-1 py-2 border-3 border-black rounded-lg font-heading text-sm transition-all ${mealsPerDay === 1 ? 'bg-quirky-green shadow-hard' : 'bg-white'}`}
                                    >
                                        JUST LUNCH
                                    </button>
                                    <button
                                        onClick={() => setMealsPerDay(2)}
                                        className={`flex-1 py-2 border-3 border-black rounded-lg font-heading text-sm transition-all ${mealsPerDay === 2 ? 'bg-quirky-green shadow-hard' : 'bg-white'}`}
                                    >
                                        LUNCH & DINNER
                                    </button>
                                </div>
                            </section>

                            {/* SECTION 3: EXTRAS */}
                            <section className="bg-white border-3 border-black p-6 rounded-2xl shadow-hard relative">
                                <div className="absolute -top-4 -left-2 bg-quirky-yellow text-black font-heading px-3 py-1 border-2 border-black -rotate-1">STEP 3</div>
                                <h3 className="font-heading text-xl mb-4 mt-2">BOOSTERS & EXTRAS</h3>
                                <div className="space-y-4">
                                    {ADD_ONS.map(addon => {
                                        const selection = addons[addon.id] || { quantity: 0, frequency: 'once' };
                                        return (
                                            <div key={addon.id} className="border-2 border-gray-200 p-3 rounded-xl hover:border-black transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-heading text-lg">{addon.name}</div>
                                                        <div className="font-body text-xs text-gray-500">{addon.desc}</div>
                                                    </div>
                                                    <div className="font-heading text-quirky-pink">₹{addon.price}</div>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateAddon(String(addon.id), Math.max(0, selection.quantity - 1), selection.frequency)}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg border-2 border-black hover:bg-red-200"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="font-heading w-6 text-center">{selection.quantity}</span>
                                                        <button
                                                            onClick={() => updateAddon(String(addon.id), selection.quantity + 1, selection.frequency)}
                                                            className="w-8 h-8 flex items-center justify-center bg-quirky-green rounded-lg border-2 border-black hover:bg-green-400"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Logic for Subscription (Kefir) vs Regular */}
                                                    {addon.allowSubscription ? (
                                                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border-2 border-gray-300">
                                                            <button
                                                                onClick={() => updateAddon(String(addon.id), selection.quantity || 1, 'once')}
                                                                className={`px-3 py-1 rounded text-[10px] font-heading transition-all ${selection.frequency === 'once' ? 'bg-white border-2 border-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                                            >
                                                                ONCE
                                                            </button>
                                                            <button
                                                                onClick={() => updateAddon(String(addon.id), selection.quantity || 1, 'daily')}
                                                                className={`px-3 py-1 rounded text-[10px] font-heading transition-all ${selection.frequency === 'daily' ? 'bg-quirky-purple text-white border-2 border-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                                            >
                                                                WITH PLAN
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">ONE TIME</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        {/* COLUMN 2: DETAILS & CHECKOUT */}
                        <div className="flex flex-col">
                            <div className="bg-white border-4 border-black p-6 rounded-2xl shadow-hard-lg sticky top-0">
                                <h3 className="font-heading text-2xl mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">4</span>
                                    THE DETAILS
                                </h3>

                                <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
                                    <input
                                        required type="text" placeholder="FULL NAME"
                                        className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-blue-50 focus:outline-none focus:shadow-hard transition-all"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            required type="tel" placeholder="PHONE"
                                            className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-green-50 focus:outline-none focus:shadow-hard transition-all"
                                            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        />
                                        <input
                                            required type="email" placeholder="EMAIL"
                                            className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-yellow-50 focus:outline-none focus:shadow-hard transition-all"
                                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                    <textarea
                                        required placeholder="FULL ADDRESS (Don't make the rider guess!)" rows={3}
                                        className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-pink-50 focus:outline-none focus:shadow-hard transition-all resize-none"
                                        value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                    ></textarea>
                                </form>

                                <div className="mt-8 border-t-4 border-dashed border-gray-300 pt-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-body text-gray-500">Plan Cost ({days}d)</span>
                                        <span className="font-heading">₹{basePlanTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-body text-gray-500">Add-ons Cost</span>
                                        <span className="font-heading">₹{calculateAddonTotal().toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-end mb-6 bg-quirky-cream p-4 rounded-xl border-2 border-black border-dashed">
                                        <div className="text-left">
                                            <div className="font-heading text-sm text-gray-400">GRAND TOTAL</div>
                                            <div className="font-heading text-5xl text-quirky-green text-stroke-sm">₹{grandTotal.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <QuirkyButton type="submit" form="checkout-form" className="w-full text-xl py-4">
                                        PAY NOW & EAT GOOD
                                    </QuirkyButton>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
