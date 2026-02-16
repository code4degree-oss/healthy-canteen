import React from 'react';
import { Users, DollarSign, Utensils, Activity } from 'lucide-react';

interface StatsData {
    activeCount: number;
    totalRevenue: number;
    proteinCounts?: Record<string, number>;
    recentOrders: any[];
}

interface AdminOverviewProps {
    stats: StatsData;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ stats }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg"><Users className="text-blue-600" size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Active Subscribers</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeCount}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-50 rounded-lg"><DollarSign className="text-green-600" size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg"><Utensils className="text-orange-600" size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Meals to Prep Today</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                        {stats.proteinCounts ? (Object.values(stats.proteinCounts) as number[]).reduce((a, b) => a + b, 0) : 0}
                    </p>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} /> Recent Orders</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {stats.recentOrders.map((order: any, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                    {order.customerName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                                    <p className="text-xs text-slate-500 truncate">{order.description}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-slate-900">₹{order.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400">{order.date}</p>
                            </div>
                        </div>
                    ))}
                    {stats.recentOrders.length === 0 && (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                <Activity size={24} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">No recent activity</p>
                            <p className="text-xs text-slate-400 mt-1">New orders will appear here automatically.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
