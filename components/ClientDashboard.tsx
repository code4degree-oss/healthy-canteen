import React, { useState, useEffect } from 'react';
import { ProteinType, AddOn, UserSubscription, OrderHistoryItem, Notification } from '../types';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Pause, Play, Plus, Zap, Calendar, ShoppingBag, Receipt, Bell, Truck, Info, CheckCircle, X } from 'lucide-react';
import { orders, subscriptions, notifications, menu, API_URL } from '../src/services/api';

interface ClientDashboardProps {
    onBack: () => void;
}

const DASH_BASE_URL = API_URL.replace('/api', '');

const getAddonImageUrl = (name: string, imagePath?: string) => {
    if (imagePath) {
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        return `${DASH_BASE_URL}${imagePath}`;
    }
    const lower = name.toLowerCase();
    if (lower.includes('kefir')) return "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop";
    if (lower.includes('cookie')) return "https://images.unsplash.com/photo-1499636138143-bd649043ea52?q=80&w=800&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop";
};

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onBack }) => {
    const [subscriptionsList, setSubscriptionsList] = useState<UserSubscription[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
    const [showAddonModal, setShowAddonModal] = useState<any | null>(null); // Helper type
    const [userName, setUserName] = useState("GYM RAT");

    const [loading, setLoading] = useState(true);

    const getTodayDeliveryStatus = (sub: UserSubscription) => {
        if (!sub.deliveryLogs) return null;
        const today = new Date().toISOString().split('T')[0];
        return sub.deliveryLogs.find((log: any) => new Date(log.deliveryTime).toISOString().split('T')[0] === today);
    };



    // Notifications State
    const [notificationList, setNotificationList] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Backend Add-ons
    const [backendAddons, setBackendAddons] = useState<AddOn[]>([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) {
            setUserName(user.name);
        }

        const fetchData = async () => {
            try {
                const [subRes, ordersRes, notifRes, addonsRes] = await Promise.all([
                    orders.getActiveSubscription(),
                    orders.getAll(),
                    notifications.getAll().catch(() => ({ data: [] })), // Handle failure gracefully
                    menu.getAddOns().catch(() => ({ data: [] }))
                ]);
                const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data ? [subRes.data] : []);

                setSubscriptionsList(subs);
                setNotificationList(notifRes.data);
                setBackendAddons(addonsRes.data);

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

    // PAUSE/RESUME LOGIC
    const handlePauseToggle = async (sub: UserSubscription) => {
        if (!confirm(sub.status === 'ACTIVE' ? 'Are you sure you want to PAUSE your plan? You can resume it anytime.' : 'Ready to RESUME your gains?')) return;

        try {
            setLoading(true);
            // reused 'pause' endpoint which now acts as a toggle
            await subscriptions.pause({
                subscriptionId: sub.id,
                startDate: '', // Not used in new logic
                days: 0       // Not used in new logic
            });
            alert(sub.status === 'ACTIVE' ? 'Plan Paused ⏸️' : 'Plan Resumed ▶️');

            // Refresh
            const subRes = await orders.getActiveSubscription();
            const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data ? [subRes.data] : []);
            setSubscriptionsList(subs);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update plan status');
        } finally {
            setLoading(false);
        }
    };

    // CANCELLATION LOGIC
    const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const handleCancelClick = (sub: UserSubscription) => {
        // Double check duration rule clientside (though backend enforces it)
        if (sub.totalDays <= 6) {
            alert("Cancellation is only available for plans longer than 6 days.");
            return;
        }
        setShowCancelModal(sub.id);
        setCancelReason('');
    };

    const handleCancelSubmit = async () => {
        if (!showCancelModal) return;
        if (!cancelReason.trim()) return alert("Please provide a reason.");

        try {
            setLoading(true);
            await subscriptions.cancel({
                subscriptionId: showCancelModal,
                reason: cancelReason // backend expects this but passed via data object in axios usually
            } as any); // Type casting if api definition isn't fully updated in TS

            alert('Plan Cancelled. Refund processing initiated.');
            setShowCancelModal(null);

            // Refresh
            const subRes = await orders.getActiveSubscription();
            const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data ? [subRes.data] : []);
            setSubscriptionsList(subs);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to cancel plan');
        } finally {
            setLoading(false);
        }
    };

    const buyAddon = (addon: AddOn, type: 'once' | 'plan', subId: number) => {
        const sub = subscriptionsList.find(s => s.id === subId);
        if (!sub) return;

        // Logic for price calculation
        const amount = type === 'plan'
            ? addon.price * sub.daysRemaining
            : addon.price;

        const desc = type === 'plan'
            ? `${addon.name} for remaining ${sub.daysRemaining} days (Plan #${sub.id})`
            : `${addon.name} (One-time) for Plan #${sub.id}`;

        initiatePayment(amount, desc, () => {
            // Success Callback
            setShowAddonModal(null);
            // In real app, re-fetch subscription data
            alert('Addon purchased! Reloading...');
            window.location.reload();
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

    const targetSub = showAddonModal?.targetSubId ? subscriptionsList.find(s => s.id === showAddonModal.targetSubId) : null;



    const handleMarkRead = async (id: number) => {
        try {
            await notifications.markRead(id);
            setNotificationList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {
            console.error("Failed to mark read");
        }
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

            {/* Notifications Bell */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="bg-white border-3 border-black p-2 md:p-3 rounded-full shadow-hard hover:scale-110 transition-transform relative"
                >
                    <Bell size={24} />
                    {notificationList.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                            {notificationList.filter(n => !n.isRead).length}
                        </span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute top-16 right-0 w-80 bg-white border-4 border-black rounded-xl shadow-hard-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <div className="bg-quirky-yellow p-3 border-b-4 border-black font-heading flex justify-between items-center">
                            <span>NOTIFICATIONS</span>
                            <button onClick={() => setShowNotifications(false)} className="hover:bg-black/10 rounded p-1"><X size={18} /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2 space-y-2 bg-quirky-cream">
                            {notificationList.length > 0 ? (
                                notificationList.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                                        className={`p-3 border-3 border-black rounded-lg cursor-pointer transition-all hover:translate-x-1 ${n.isRead ? 'bg-white opacity-60' : 'bg-white shadow-hard-sm'}`}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={`p-2 rounded-full border-2 border-black ${n.type === 'delivery' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                                                {n.type === 'delivery' ? <Truck size={16} /> : <Info size={16} />}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-sm ${!n.isRead ? 'text-black' : 'text-gray-500'}`}>{n.title} {!n.isRead && <span className="text-red-500 text-[8px] align-top">●</span>}</div>
                                                <div className="text-xs text-gray-600 leading-tight mt-1">{n.message}</div>
                                                <div className="text-[10px] text-gray-400 mt-2 text-right">{new Date(n.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 font-bold text-sm">NO NEW ALERTS 💤</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header Greeting */}
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="font-heading text-4xl md:text-6xl text-quirky-black mb-2">HELLO, {userName.toUpperCase()} 👋</h1>
                        <p className="font-body text-lg md:text-xl">Let's check your gains status.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="font-heading text-2xl text-center py-20 animate-pulse">LOADING GAINS...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                        {/* Subscriptions List */}
                        <div className="lg:col-span-2 space-y-6">
                            {subscriptionsList.length > 0 ? (
                                subscriptionsList.map(sub => (
                                    <div key={sub.id} className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard-xl relative overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                            <Zap size={100} />
                                        </div>

                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h2 className="font-heading text-2xl md:text-3xl">{sub.protein} PLAN</h2>
                                                    <span className={`px-2 py-0.5 text-xs font-bold border border-black rounded ${sub.status === 'ACTIVE' ? 'bg-green-300' : sub.status === 'PAUSED' ? 'bg-yellow-300' : 'bg-gray-300'}`}>{sub.status}</span>
                                                </div>
                                                <p className="font-body text-gray-500">{sub.mealsPerDay} Meal / Day</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-heading text-4xl md:text-5xl text-quirky-green text-stroke-sm">{sub.daysRemaining}</div>
                                                <div className="font-body text-xs font-bold uppercase">Days Left</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 h-6 border-2 border-black rounded-full mb-8 relative overflow-hidden">
                                            <div
                                                className="bg-quirky-yellow h-full border-r-2 border-black transition-all duration-1000"
                                                style={{ width: `${((sub.totalDays - sub.daysRemaining) / sub.totalDays) * 100}%` }}
                                            ></div>
                                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1)_100%)] bg-[length:20px_20px] opacity-50"></div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                            {/* Action Buttons */}
                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    onClick={() => handlePauseToggle(sub)}
                                                    className="flex-1 py-3 px-4 border-2 border-black rounded-xl font-heading text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-hard uppercase"
                                                >
                                                    {sub.status === 'PAUSED' ? <Play size={18} /> : <Pause size={18} />}
                                                    {sub.status === 'PAUSED' ? 'RESUME PLAN' : 'PAUSE PLAN'}
                                                </button>

                                                {/* Cancel Button - Replaces Add Items */}
                                                {sub.totalDays > 6 && (
                                                    <button
                                                        onClick={() => handleCancelClick(sub)}
                                                        className="flex-1 py-3 px-4 bg-red-100 border-2 border-black rounded-xl font-heading text-sm text-red-600 flex items-center justify-center gap-2 hover:bg-red-200 transition-colors shadow-hard uppercase"
                                                    >
                                                        <X size={18} />
                                                        CANCEL PLAN
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* RIGHT SIDE: Today's Delivery Status */}
                                        <div className="md:col-span-1 space-y-4">
                                            <div className={`p-6 border-2 border-black rounded-2xl shadow-hard ${getTodayDeliveryStatus(sub)?.status === 'OUT_FOR_DELIVERY' || getTodayDeliveryStatus(sub)?.status === 'ASSIGNED'
                                                ? 'bg-quirky-green'
                                                : 'bg-white'
                                                }`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-2 bg-black/5 rounded-lg border border-black/10">
                                                        <Truck size={24} className="text-black" />
                                                    </div>
                                                    <span className="font-heading text-xs bg-black text-white px-2 py-1 rounded">
                                                        {new Date().toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <h3 className="font-heading text-xl mb-1">TODAY'S DROP 📦</h3>

                                                {(() => {
                                                    const todayLog = getTodayDeliveryStatus(sub);
                                                    if (todayLog) {
                                                        if (todayLog.status === 'DELIVERED') return <p className="font-bold text-green-700">DELIVERED ✅</p>;
                                                        if (todayLog.status === 'OUT_FOR_DELIVERY' || todayLog.status === 'ASSIGNED') return (
                                                            <div>
                                                                <p className="font-bold text-black text-lg animate-pulse">FOOD IS ON THE WAY!</p>
                                                                {todayLog.deliveryAgent && (
                                                                    <p className="text-sm mt-1 font-medium">Rider: {todayLog.deliveryAgent.name}</p>
                                                                )}
                                                            </div>
                                                        );
                                                        return <p className="font-bold text-slate-500">PREPARING... 🍳</p>;
                                                    } else if (sub.status === 'ACTIVE') {
                                                        return <p className="font-bold text-slate-500">SCHEDULED</p>;
                                                    } else {
                                                        return <p className="font-bold text-slate-400">NO DELIVERY (PAUSED)</p>;
                                                    }
                                                })()}
                                            </div>

                                            {/* Delivery History List (Mini) */}
                                            <div className="bg-white border-2 border-black rounded-2xl shadow-hard overflow-hidden">
                                                <div className="p-4 border-b-2 border-black bg-gray-50">
                                                    <h3 className="font-heading text-lg">DELIVERY HISTORY 🚚</h3>
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto p-2 space-y-2">
                                                    {sub.deliveryLogs && sub.deliveryLogs.length > 0 ? (
                                                        sub.deliveryLogs.slice(0, 10).map((log: any) => (
                                                            <div key={log.id} className="flex justify-between items-center p-3 bg-white border border-black rounded-lg text-sm hover:bg-gray-50">
                                                                <div>
                                                                    <p className="font-bold">{new Date(log.deliveryTime).toLocaleDateString()}</p>
                                                                    {log.deliveryAgent && <p className="text-xs text-slate-500">Via {log.deliveryAgent.name}</p>}
                                                                </div>
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border border-black ${log.status === 'DELIVERED' ? 'bg-green-200' : 'bg-yellow-200'
                                                                    }`}>
                                                                    {log.status}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-center py-4 text-slate-400 text-sm">No recent deliveries.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard-xl flex items-center justify-center flex-col text-center min-h-[300px]">
                                    <h2 className="font-heading text-2xl mb-4">NO ACTIVE PLAN</h2>
                                    <p className="mb-6 max-w-md">You are running on empty! Start a plan to get those gains.</p>
                                    <button onClick={onBack} className="bg-quirky-green border-2 border-black px-6 py-3 rounded-xl font-heading hover:scale-105 transition-transform shadow-hard">START A PLAN</button>
                                </div>
                            )}
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

            {/* CANCEL REASON MODAL */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white border-4 border-black p-6 md:p-8 rounded-3xl max-w-md w-full shadow-hard-xl transform rotate-1 relative">
                        <button onClick={() => setShowCancelModal(null)} className="absolute top-4 right-4 hover:scale-110 transition-transform p-2">X</button>
                        <h3 className="font-heading text-2xl mb-4 text-center text-red-500">CANCEL PLAN? 😢</h3>
                        <p className="text-gray-600 mb-4 text-sm text-center">We're sad to see you go. Please tell us why you are cancelling so we can improve.</p>

                        <div className="space-y-4">
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="I'm cancelling because..."
                                className="w-full p-3 border-2 border-black rounded-xl font-body min-h-[100px]"
                            />
                            <button
                                onClick={handleCancelSubmit}
                                className="w-full py-3 bg-red-400 text-white border-2 border-black rounded-xl font-heading hover:bg-red-500 shadow-hard"
                            >
                                CONFIRM CANCELLATION
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Addon Payment Modal */}
            {showAddonModal && targetSub && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white border-4 border-black p-6 md:p-8 rounded-3xl max-w-md w-full shadow-hard-xl transform rotate-1 relative">
                        <button onClick={() => setShowAddonModal(null)} className="absolute top-4 right-4 hover:scale-110 transition-transform p-2">X</button>

                        <h3 className="font-heading text-2xl mb-2 text-center">ADD {showAddonModal.name}</h3>
                        <p className="text-center text-gray-500 mb-8">{showAddonModal.desc}</p>

                        <div className="space-y-4">
                            <button
                                onClick={() => buyAddon(showAddonModal, 'once', targetSub.id)}
                                className="w-full flex justify-between items-center p-4 border-3 border-black rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <span className="font-heading">JUST ONCE</span>
                                <span className="font-heading bg-quirky-yellow px-3 py-1 border-2 border-black group-hover:shadow-hard-sm">₹{showAddonModal.price}</span>
                            </button>

                            {showAddonModal.allowSubscription && (
                                <button
                                    onClick={() => buyAddon(showAddonModal, 'plan', targetSub.id)}
                                    className="w-full flex justify-between items-center p-4 border-3 border-black bg-quirky-green rounded-xl hover:bg-green-400 transition-colors shadow-hard hover:shadow-hard-lg group"
                                >
                                    <div className="text-left">
                                        <span className="font-heading block">FOR {targetSub.daysRemaining} DAYS</span>
                                        <span className="text-xs font-bold block">Rest of your plan</span>
                                    </div>
                                    <span className="font-heading bg-white px-3 py-1 border-2 border-black group-hover:shadow-hard-sm">
                                        ₹{showAddonModal.price * targetSub.daysRemaining}
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