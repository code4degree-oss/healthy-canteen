
import React, { useState, useEffect } from 'react';
import { admin } from '../../src/services/api';
import { MapPin, User, Clock, Calendar } from 'lucide-react';

export const AdminDeliveryHistory: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [date]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await admin.getDeliveryHistory(date);
            setLogs(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="text-blue-600" /> Delivery History
                </h2>
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Agent</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Location (When Delivered)</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Loading history...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No deliveries found for this date.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            {new Date(log.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                    {log.deliveryAgent?.name?.charAt(0) || '?'}
                                                </div>
                                                <span>{log.deliveryAgent?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{log.Subscription?.User?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-400">{log.Subscription?.User?.address || 'No Address'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.latitude && log.longitude ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                                >
                                                    <MapPin size={14} />
                                                    View Location
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs">Not Captured</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'NO_RECEIVE' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {log.status === 'NO_RECEIVE' ? 'No One to Receive' : log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
