import React, { useState, useEffect } from 'react';
import { ProteinType, AddOn, UserSubscription, OrderHistoryItem } from '../types';
import { ADD_ONS } from '../constants';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Pause, Play, Plus, Zap, Calendar, ShoppingBag, Receipt } from 'lucide-react';
import { orders, subscriptions } from '../src/services/api';

interface ClientDashboardProps {
    onBack: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onBack }) => {
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
    const [showAddonModal, setShowAddonModal] = useState<AddOn | null>(null);
    const [userName, setUserName] = useState("GYM RAT");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) {
            setUserName(user.name);
        }

        const fetchData = async () => {
            try {
                const [subRes, ordersRes] = await Promise.all([
                    orders.getActiveSubscription(),
                    orders.getAll()
                ]);
                setSubscription(subRes.data);

                // Map backend order to frontend OrderHistoryItem
                const mappedOrders = ordersRes.data.map((o: any) => ({
                    orderId: `ORD-${o.id}`,
                    date: o.startDate,
                    amount: o.totalPrice,
                    description: `${o.days} Days (${o.protein})`,
                    status: o.status
                }));
                setOrderHistory(mappedOrders);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Use the 0.05 opacity doodle to match index.html
    const doodlePattern = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E.d%7Bfill:none;stroke:%23000;stroke-opacity:0.05;stroke-width:2;stroke-linecap:round;stroke-linejoin:round%7D%3C/style%3E%3Cpath class='d' d='M20,20 Q30,5 40,20 T60,20' /%3E%3Ccircle class='d' cx='80' cy='80' r='8' /%3E%3Cpath class='d' d='M10,80 Q20,70 30,80 T50,80' /%3E%3Cpath class='d' d='M70,20 L80,30 M80,20 L70,30' /%3E%3Cpath class='d' d='M40,50 A10,10 0 0,1 60,50' /%3E%3C/svg%3E")`;

    // --- Handlers ---

    const [showPauseModal, setShowPauseModal] = useState(false);
    const [pauseConfig, setPauseConfig] = useState({ date: '', days: 1 });

    const handlePauseClick = () => {
        if (!subscription || subscription.status !== 'ACTIVE') return;

        // Default start date: Tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setPauseConfig({ date: tomorrow.toISOString().split('T')[0], days: 1 });
        setShowPauseModal(true);
    };

    const handlePauseSubmit = async () => {
        if (!subscription) return;
        try {
            setLoading(true);
            await subscriptions.pause({
                subscriptionId: subscription.id,
                startDate: pauseConfig.date,
                days: pauseConfig.days
            });
            alert(`Subscription paused for ${pauseConfig.days} days!`);
            setShowPauseModal(false);
            // Refresh data
            const subRes = await orders.getActiveSubscription();
            setSubscription(subRes.data);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to pause');
        } finally {
            setLoading(false);
        }
    };

    const buyAddon = (addon: AddOn, type: 'once' | 'plan') => {
        if (!subscription) return;

        // Logic for price calculation
        const amount = type === 'plan'
            ? addon.price * subscription.daysRemaining
            : addon.price;

        const desc = type === 'plan'
            ? `${addon.name} for remaining ${subscription.daysRemaining} days`
            : `${addon.name} (One-time)`;

        initiatePayment(amount, desc, () => {
            // Success Callback
            setShowAddonModal(null);
            // In real app, re-fetch subscription data
        });
    };

    const initiatePayment = (amount: number, description: string, onSuccess: () => void) => {
        if (!window.Razorpay) {
            alert("Razorpay SDK not loaded.");
            return;
        }
        const options = {
            key: "YOUR_RAZORPAY_KEY",
            amount: amount * 100,
            currency: "INR",
            name: "The Healthy Canteen",
            description: description,
            handler: function (response: any) {
                alert(`Payment Successful: ${response.razorpay_payment_id}`);
                onSuccess();
            },
            theme: { color: "#a3e635" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <div
            className="min-h-screen bg-quirky-cream p-4 md:p-8 pt-24 pb-24 relative overflow-hidden"
            style={{ backgroundImage: doodlePattern, backgroundSize: '100px 100px' }}
        >
            {/* Funky Decor Blob */}
            <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-quirky-green rounded-full blur-[100px] opacity-20 pointer-events-none animate-float"></div>

            {/* Navigation */}
            <button onClick={onBack} className="fixed top-6 left-6 z-40 bg-white border-3 border-black p-2 md:p-3 rounded-full shadow-hard hover:scale-110 transition-transform">
                <ArrowLeft size={24} />
            </button>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header Greeting */}
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="font-heading text-4xl md:text-6xl text-quirky-black mb-2">HELLO, {userName.toUpperCase()} 👋</h1>
                        <p className="font-body text-lg md:text-xl">Let's check your gains status.</p>
                    </div>
                    {subscription ? (
                        <div className={`px-4 py-2 md:px-6 rounded-full border-3 border-black font-heading text-sm md:text-base ${subscription.status === 'ACTIVE' ? 'bg-quirky-green animate-pulse' : 'bg-gray-300'}`}>
                            STATUS: {subscription.status}
                        </div>
                    ) : (
                        <div className="px-4 py-2 md:px-6 rounded-full border-3 border-black font-heading text-sm md:text-base bg-gray-300">
                            NO ACTIVE PLAN
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="font-heading text-2xl text-center py-20 animate-pulse">LOADING GAINS...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                        {/* Subscription Card */}
                        {subscription ? (
                            <div className="lg:col-span-2 bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard-xl relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Zap size={100} />
                                </div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h2 className="font-heading text-2xl md:text-3xl mb-1">{subscription.protein} PLAN</h2>
                                        <p className="font-body text-gray-500">{subscription.mealsPerDay} Meal / Day</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-heading text-4xl md:text-5xl text-quirky-green text-stroke-sm">{subscription.daysRemaining}</div>
                                        <div className="font-body text-xs font-bold uppercase">Days Left</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 h-6 border-2 border-black rounded-full mb-8 relative overflow-hidden">
                                    <div
                                        className="bg-quirky-yellow h-full border-r-2 border-black transition-all duration-1000"
                                        style={{ width: `${((subscription.totalDays - subscription.daysRemaining) / subscription.totalDays) * 100}%` }}
                                    ></div>
                                    {/* Stripes */}
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1)_100%)] bg-[length:20px_20px] opacity-50"></div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={handlePauseClick}
                                        disabled={subscription.pausesRemaining <= 0}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 border-3 border-black rounded-xl font-heading transition-all ${subscription.status === 'ACTIVE' ? 'bg-white hover:bg-yellow-100' : 'bg-gray-200 cursor-not-allowed'}`}
                                    >
                                        <Pause size={20} />
                                        {subscription.pausesRemaining > 0 ? 'PAUSE PLAN' : 'NO PAUSES LEFT'}
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 py-3 md:py-4 border-3 border-black rounded-xl font-heading bg-quirky-blue text-white hover:bg-blue-400">
                                        <Calendar size={20} /> VIEW MENU
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="lg:col-span-2 bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard-xl flex items-center justify-center flex-col text-center min-h-[300px]">
                                <h2 className="font-heading text-2xl mb-4">NO ACTIVE PLAN</h2>
                                <p className="mb-6 max-w-md">You are running on empty! Start a plan to get those gains.</p>
                                <button onClick={onBack} className="bg-quirky-green border-2 border-black px-6 py-3 rounded-xl font-heading hover:scale-105 transition-transform shadow-hard">START A PLAN</button>
                            </div>
                        )}

                        {/* Quick Add-ons */}
                        <div className="bg-quirky-pink border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard text-white relative">
                            <h3 className="font-heading text-2xl mb-6 border-b-4 border-white pb-2">NEED A BOOST?</h3>
                            <div className="space-y-4">
                                {ADD_ONS.map((addon) => (
                                    <div key={addon.id} className="bg-white text-black p-4 rounded-xl border-2 border-black flex justify-between items-center group hover:scale-105 transition-transform">
                                        <div>
                                            <div className="font-heading text-lg">{addon.name}</div>
                                            <div className="font-heading text-sm text-quirky-pink">₹{addon.price}</div>
                                        </div>
                                        <button
                                            onClick={() => setShowAddonModal(addon)}
                                            className="bg-quirky-green border-2 border-black p-2 rounded-lg hover:bg-green-400"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-6 text-xs font-bold text-center opacity-80">
                                Added items will be delivered with your next meal.
                            </p>
                        </div>

                    </div>
                )}

                {/* ORDER HISTORY SECTION */}
                <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-quirky-yellow border-2 border-black rounded-lg transform -rotate-2">
                            <Receipt size={24} />
                        </div>
                        <h2 className="font-heading text-2xl md:text-3xl">FUEL HISTORY ⛽</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b-2 border-black font-heading text-sm text-gray-500">
                                    <th className="py-3 px-2">ORDER ID</th>
                                    <th className="py-3 px-2">DATE</th>
                                    <th className="py-3 px-2">DESCRIPTION</th>
                                    <th className="py-3 px-2 text-right">AMOUNT</th>
                                    <th className="py-3 px-2 text-right">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="font-body text-sm md:text-base">
                                {orderHistory.length > 0 ? (
                                    orderHistory.map((order) => (
                                        <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-2 font-bold">{order.orderId}</td>
                                            <td className="py-4 px-2 text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                                            <td className="py-4 px-2">{order.description}</td>
                                            <td className="py-4 px-2 text-right font-heading">₹{order.amount.toLocaleString()}</td>
                                            <td className="py-4 px-2 text-right">
                                                <span className={`inline-block px-2 py-1 rounded-md border-2 border-black text-[10px] font-bold shadow-[2px_2px_0_0_#000] ${order.status === 'PAID' ? 'bg-quirky-green text-black' :
                                                    order.status === 'PENDING' ? 'bg-quirky-yellow text-black' :
                                                        'bg-red-400 text-white'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500 font-bold">NO ORDERS YET. START EATING!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* PAUSE MODAL */}
            {showPauseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white border-4 border-black p-6 md:p-8 rounded-3xl max-w-md w-full shadow-hard-xl transform -rotate-1 relative">
                        <button onClick={() => setShowPauseModal(false)} className="absolute top-4 right-4 hover:scale-110 transition-transform p-2">X</button>
                        <h3 className="font-heading text-2xl mb-4 text-center">PAUSE PLAN ⏸️</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={pauseConfig.date}
                                    onChange={(e) => setPauseConfig({ ...pauseConfig, date: e.target.value })}
                                    className="w-full p-3 border-2 border-black rounded-lg font-body"
                                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Must be at least 1 day in advance (before 4PM).</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Duration (Days)</label>
                                <select
                                    value={pauseConfig.days}
                                    onChange={(e) => setPauseConfig({ ...pauseConfig, days: Number(e.target.value) })}
                                    className="w-full p-3 border-2 border-black rounded-lg font-body"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(d => <option key={d} value={d}>{d} Days</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handlePauseSubmit}
                                className="w-full py-3 bg-quirky-yellow border-2 border-black rounded-xl font-heading hover:bg-yellow-400 shadow-hard mt-4"
                            >
                                CONFIRM PAUSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Addon Payment Modal */}
            {showAddonModal && subscription && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white border-4 border-black p-6 md:p-8 rounded-3xl max-w-md w-full shadow-hard-xl transform rotate-1 relative">
                        <button onClick={() => setShowAddonModal(null)} className="absolute top-4 right-4 hover:scale-110 transition-transform p-2">X</button>

                        <h3 className="font-heading text-2xl mb-2 text-center">ADD {showAddonModal.name}</h3>
                        <p className="text-center text-gray-500 mb-8">{showAddonModal.desc}</p>

                        <div className="space-y-4">
                            <button
                                onClick={() => buyAddon(showAddonModal, 'once')}
                                className="w-full flex justify-between items-center p-4 border-3 border-black rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <span className="font-heading">JUST ONCE</span>
                                <span className="font-heading bg-quirky-yellow px-3 py-1 border-2 border-black group-hover:shadow-hard-sm">₹{showAddonModal.price}</span>
                            </button>

                            {showAddonModal.allowSubscription && (
                                <button
                                    onClick={() => buyAddon(showAddonModal, 'plan')}
                                    className="w-full flex justify-between items-center p-4 border-3 border-black bg-quirky-green rounded-xl hover:bg-green-400 transition-colors shadow-hard hover:shadow-hard-lg group"
                                >
                                    <div className="text-left">
                                        <span className="font-heading block">FOR {subscription.daysRemaining} DAYS</span>
                                        <span className="text-xs font-bold block">Rest of your plan</span>
                                    </div>
                                    <span className="font-heading bg-white px-3 py-1 border-2 border-black group-hover:shadow-hard-sm">
                                        ₹{showAddonModal.price * subscription.daysRemaining}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};