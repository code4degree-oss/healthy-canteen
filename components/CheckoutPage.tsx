import React, { useState } from 'react';
import { OrderConfig, AddOn } from '../types';
import { ADD_ONS } from '../constants';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Check, Plus, Minus } from 'lucide-react';

interface CheckoutPageProps {
    orderConfig: OrderConfig;
    onBack: () => void;
}

// Razorpay type definition for window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ orderConfig, onBack }) => {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

    const toggleAddon = (id: string | number, price: number) => {
        const key = String(id);
        setSelectedAddons(prev => {
            const current = prev[key] || 0;
            return { ...prev, [key]: current + 1 };
        });
    };

    const removeAddon = (id: string | number) => {
        const key = String(id);
        setSelectedAddons(prev => {
            const current = prev[key] || 0;
            if (current <= 0) return prev;
            return { ...prev, [key]: current - 1 };
        });
    };

    const calculateAddonTotal = () => {
        return ADD_ONS.reduce((total, addon) => {
            const count = selectedAddons[String(addon.id)] || 0;
            const price = typeof addon.price === 'number' ? addon.price : 0;
            return total + (count * price);
        }, 0);
    };

    const grandTotal = orderConfig.totalPrice + calculateAddonTotal();

    const handlePayment = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // SIMULATED PAYMENT (Razorpay not integrated yet)
        alert("Payment Logic Placeholder: Payment Successful!");
        // In real flow: options.handler(response) would be called
        setShowTermsModal(false);
        return;
    };

    const handleManualSubmit = () => {
        const formEl = document.getElementById('checkout-form') as HTMLFormElement;

        if (formEl && !formEl.checkValidity()) {
            formEl.reportValidity(); // Shows browser validation tooltips
            return;
        }

        // Open Modal instead of checking inline state
        setShowTermsModal(true);
    };

    return (
        <div className="min-h-screen bg-quirky-cream p-4 md:p-8 pt-24 pb-24">

            <button
                onClick={onBack}
                className="fixed top-6 left-6 z-50 bg-white border-3 border-black p-3 rounded-full shadow-hard hover:scale-110 transition-transform"
            >
                <ArrowLeft size={24} />
            </button>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* LEFT: Details Form */}
                <div>
                    <h2 className="font-heading text-4xl mb-8 flex items-center gap-3">
                        DETAILS 📝
                    </h2>

                    <form id="checkout-form" onSubmit={handlePayment} className="space-y-6 bg-white border-4 border-black p-8 rounded-3xl shadow-hard-lg">
                        <div>
                            <label className="font-heading text-sm mb-2 block uppercase">Full Name</label>
                            <input
                                required
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-blue-50 focus:shadow-hard transition-all"
                                placeholder="Gym Rat"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="font-heading text-sm mb-2 block uppercase">Phone</label>
                                <input
                                    required
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-green-50 focus:shadow-hard transition-all"
                                    placeholder="98765..."
                                />
                            </div>
                            <div>
                                <label className="font-heading text-sm mb-2 block uppercase">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-yellow-50 focus:shadow-hard transition-all"
                                    placeholder="@"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="font-heading text-sm mb-2 block uppercase">Delivery Address</label>
                            <textarea
                                required
                                rows={4}
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-pink-50 focus:shadow-hard transition-all resize-none"
                                placeholder="Full address with landmark..."
                            />
                        </div>
                    </form>
                </div>

                {/* RIGHT: Order Summary & Addons */}
                <div className="space-y-8">

                    {/* Plan Summary */}
                    <div className="bg-quirky-yellow border-4 border-black p-6 rounded-3xl shadow-hard transform rotate-1">
                        <h3 className="font-heading text-2xl mb-4 border-b-4 border-black pb-2">ORDER SUMMARY</h3>
                        <div className="space-y-2 font-heading text-lg">
                            <div className="flex justify-between">
                                <span>{orderConfig.days} DAY PLAN ({orderConfig.protein})</span>
                                <span>₹{orderConfig.totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>{orderConfig.mealsPerDay} Meal(s) / Day</span>
                                <span>-</span>
                            </div>
                        </div>
                    </div>

                    {/* Addons */}
                    <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-hard">
                        <h3 className="font-heading text-2xl mb-6">ADD EXTRAS 🥤</h3>
                        <div className="space-y-4">
                            {ADD_ONS.map(addon => {
                                const count = selectedAddons[String(addon.id)] || 0;
                                return (
                                    <div key={addon.id} className="flex items-center justify-between border-2 border-gray-200 p-3 rounded-xl hover:border-black transition-colors">
                                        <div>
                                            <p className="font-heading text-lg leading-none">{addon.name}</p>
                                            <p className="font-body text-xs text-gray-500">{addon.desc}</p>
                                            <p className="font-heading text-sm text-quirky-pink mt-1">₹{addon.price}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {count > 0 && (
                                                <>
                                                    <button
                                                        onClick={() => removeAddon(addon.id)}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full border-2 border-black hover:bg-red-200"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="font-heading text-lg w-4 text-center">{count}</span>
                                                </>
                                            )}
                                            <button
                                                onClick={() => toggleAddon(addon.id, Number(addon.price))}
                                                className="w-8 h-8 flex items-center justify-center bg-quirky-green rounded-full border-2 border-black hover:bg-green-400 shadow-hard-sm active:translate-y-1 active:shadow-none transition-all"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total & Pay */}
                    <div className="bg-quirky-black text-white p-8 rounded-3xl border-4 border-white shadow-xl">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <p className="font-heading text-sm text-gray-400">TOTAL AMOUNT</p>
                                <p className="font-heading text-5xl text-quirky-green">₹{grandTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            className="w-full bg-white text-black font-heading text-xl py-5 rounded-xl hover:bg-quirky-pink hover:text-white transition-colors border-4 border-transparent hover:border-white"
                        >
                            REVIEW & PAY
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-2 font-body">
                            Secured by Razorpay. No refunds on tasty food.
                        </p>
                    </div>

                </div>

                {/* T&C MODAL */}
                {showTermsModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-hard-xl max-w-md w-full border-4 border-black overflow-hidden transform scale-100 transition-transform">
                            <div className="bg-quirky-yellow p-4 border-b-4 border-black flex justify-between items-center">
                                <h3 className="font-heading text-xl">TERMS & CONDITIONS 📜</h3>
                                <button onClick={() => setShowTermsModal(false)} className="hover:scale-110 transition-transform">
                                    <ArrowLeft size={24} className="rotate-180" />
                                    {/* Using Arrow as Close/Back visual or could allow X */}
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="font-body text-gray-700">
                                    Please review and accept our policies before proceeding with your tasty order.
                                </p>

                                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 text-sm text-slate-600">
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>No refunds on food items once prepared.</li>
                                        <li>Delivery times are estimates.</li>
                                        <li>Subscription pauses require 24h notice.</li>
                                    </ul>
                                    <a href="/policies" target="_blank" className="block mt-3 text-blue-600 font-bold hover:underline">Read Full Policy →</a>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setShowTermsModal(false)}
                                        className="flex-1 py-3 border-2 border-black rounded-xl font-heading hover:bg-gray-100 transition-colors"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={() => handlePayment()}
                                        className="flex-1 py-3 bg-quirky-green border-2 border-black rounded-xl font-heading hover:bg-green-400 transition-colors shadow-hard-sm active:translate-y-1 active:shadow-none"
                                    >
                                        I AGREE & PAY
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};