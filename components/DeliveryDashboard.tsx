import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Phone, Navigation, CheckCircle, Clock, XCircle, History, Calendar } from 'lucide-react';
import { delivery } from '../src/services/api';

interface DeliveryDashboardProps {
    onBack: () => void;
}

interface DeliveryItem {
    id: number;
    customerName: string;
    address: string;
    phone: string;
    type: string;
    meals: number;
    timeSlot: string;
    status: string;
    lat?: number;
    lng?: number;
    logId?: number;
}

interface HistoryItem {
    id: number;
    subscriptionId: number;
    customerName: string;
    address: string;
    type: string;
    status: string;
    deliveryTime: string;
    latitude?: number;
    longitude?: number;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ onBack }) => {
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

    // History State
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchQueue();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, historyDate]);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await delivery.getQueue();
            setDeliveries(res.data);
        } catch (error) {
            console.error("Failed to fetch deliveries", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await delivery.getHistory(historyDate);
            setHistoryItems(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleConfirmDelivery = (item: DeliveryItem) => {
        if (confirm("Confirm delivery for " + item.customerName + "?")) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    await delivery.confirm({
                        subscriptionId: item.id,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    alert("Delivery confirmed!");
                    setDeliveries(deliveries.filter(d => d.id !== item.id));
                } catch (e) {
                    alert("Failed to confirm delivery");
                }
            }, () => {
                alert("Location access required to confirm delivery!");
            });
        }
    };

    const handleNoReceive = async (item: DeliveryItem) => {
        if (confirm(`Mark "${item.customerName}" as no one to receive?`)) {
            try {
                await delivery.noReceive({ subscriptionId: item.id });
                alert("Marked as no one to receive");
                setDeliveries(deliveries.filter(d => d.id !== item.id));
            } catch (e) {
                alert("Failed to update status");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-professional text-slate-900">
            <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-base font-semibold leading-tight">Delivery App</h1>
                            <p className="text-xs text-slate-400">Today's Route</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                        <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-slate-200">Online</span>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-md mx-auto px-4 pt-4">
                <div className="flex bg-slate-200 rounded-lg p-1 mb-4">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'queue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Clock size={16} /> Queue ({deliveries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} /> History
                    </button>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pb-8 space-y-4">
                {activeTab === 'queue' && (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Today's Queue</h2>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">{deliveries.length} Packages</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-slate-400">Loading route...</div>
                        ) : deliveries.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-400" />
                                </div>
                                <p className="text-slate-500 font-medium">All deliveries completed!</p>
                                <p className="text-xs text-slate-400 mt-1">Check the History tab for today's log</p>
                            </div>
                        ) : (
                            deliveries.map(item => (
                                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                                    {/* Header */}
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.type === 'CHICKEN' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                <Clock size={12} /> {item.timeSlot}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-lg font-bold text-slate-900">{item.customerName}</h3>
                                            <span className="text-xs font-mono text-slate-400">#{item.id}</span>
                                        </div>

                                        <div className="flex items-start gap-3 text-sm text-slate-600 mb-5 bg-slate-50 p-3 rounded border border-slate-100">
                                            <MapPin size={16} className="mt-0.5 text-red-500 shrink-0" />
                                            <p className="leading-snug font-medium">{item.address}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            {item.phone && item.phone !== 'N/A' && (
                                                <a href={`tel:${item.phone}`} className="flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                                                    <Phone size={16} />
                                                    Call
                                                </a>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (item.lat && item.lng) {
                                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`, '_blank');
                                                    } else {
                                                        alert("No location data for this order.");
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <Navigation size={16} />
                                                Navigate
                                            </button>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleConfirmDelivery(item)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
                                                <CheckCircle size={18} />
                                                CONFIRM DELIVERY
                                            </button>
                                            <button
                                                onClick={() => handleNoReceive(item)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-red-600 border-2 border-red-200 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors">
                                                <XCircle size={16} />
                                                No One to Receive
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'history' && (
                    <>
                        {/* Date Picker */}
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar size={18} className="text-slate-400" />
                            <input
                                type="date"
                                value={historyDate}
                                onChange={e => setHistoryDate(e.target.value)}
                                className="flex-1 p-2 border border-slate-300 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                {historyDate === new Date().toISOString().split('T')[0] ? "Today's Deliveries" : new Date(historyDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h2>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">{historyItems.length} Entries</span>
                        </div>

                        {historyLoading ? (
                            <div className="text-center py-12 text-slate-400">Loading history...</div>
                        ) : historyItems.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <History size={32} className="text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">No deliveries for this date</p>
                            </div>
                        ) : (
                            historyItems.map(item => (
                                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{item.customerName}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <MapPin size={12} /> {item.address}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'DELIVERED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.status === 'DELIVERED' ? '✓ Delivered' : '✗ No Receive'}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(item.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.type === 'CHICKEN' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                            {item.type}
                                        </span>
                                        {item.latitude && item.longitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                                            >
                                                <MapPin size={10} /> View on Map
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </main>
        </div>
    );
};