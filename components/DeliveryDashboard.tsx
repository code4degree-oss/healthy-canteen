import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Phone, Navigation, CheckCircle, Clock } from 'lucide-react';
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
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ onBack }) => {
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const res = await delivery.getQueue();
                setDeliveries(res.data);
            } catch (error) {
                console.error("Failed to fetch deliveries", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, []);

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
                            <p className="text-xs text-slate-400">Route #405 • Pune</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                        <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-slate-200">Online</span>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">

                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Today's Queue</h2>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">{deliveries.length} Packages</span>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading route...</div>
                ) : deliveries.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No deliveries scheduled for today!</div>
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
                                            if ((item as any).lat && (item as any).lng) {
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${(item as any).lat},${(item as any).lng}`, '_blank');
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

                                <button
                                    onClick={() => {
                                        if (confirm("Confirm delivery for " + item.customerName + "?")) {
                                            navigator.geolocation.getCurrentPosition(async (pos) => {
                                                try {
                                                    await delivery.confirm({
                                                        subscriptionId: item.id,
                                                        lat: pos.coords.latitude,
                                                        lng: pos.coords.longitude
                                                    });
                                                    alert("Delivery confirmed!");
                                                    // Optimistic update or refetch
                                                    setDeliveries(deliveries.filter(d => d.id !== item.id));
                                                } catch (e) {
                                                    alert("Failed to confirm delivery API");
                                                }
                                            }, (err) => {
                                                alert("Location access required to confirm delivery!");
                                            });
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
                                    <CheckCircle size={18} />
                                    CONFIRM DELIVERY
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};