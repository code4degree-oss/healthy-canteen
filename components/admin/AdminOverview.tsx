import React from 'react';
import { Users, DollarSign, Utensils, Activity } from 'lucide-react';

interface StatsData {
    activeCount: number;
    totalRevenue: number;
    proteinCounts?: Record<string, Record<string, number>>;
    tomorrowPrepCounts?: Record<string, Record<string, number>>;
    recentOrders: any[];
}

interface AdminOverviewProps {
    stats: StatsData;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ stats }) => {

    const calculateTotal = (counts?: Record<string, Record<string, number>>) => {
        if (!counts) return 0;
        let total = 0;
        Object.values(counts).forEach(mealTypeCounts => {
            Object.values(mealTypeCounts).forEach(c => total += c);
        });
        return total;
    };

    const calculateMealTypeTotal = (counts: Record<string, Record<string, number>> | undefined, type: string) => {
        if (!counts || !counts[type]) return 0;
        return Object.values(counts[type]).reduce((a, b) => a + b, 0);
    };

    const calculateProteinTotals = (counts?: Record<string, Record<string, number>>) => {
        if (!counts) return {};
        const totals: Record<string, number> = {};
        Object.values(counts).forEach(mealTypeCounts => {
            Object.entries(mealTypeCounts).forEach(([protein, count]) => {
                totals[protein] = (totals[protein] || 0) + count;
            });
        });
        return totals;
    };

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
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                            {calculateTotal(stats.proteinCounts)}
                        </p>
                        <span className="text-xs text-slate-400">
                            (L: {calculateMealTypeTotal(stats.proteinCounts, 'LUNCH')} / D: {calculateMealTypeTotal(stats.proteinCounts, 'DINNER')})
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg"><Activity className="text-purple-600" size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Tomorrow's Prep</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                        {calculateTotal(stats.tomorrowPrepCounts)}
                    </p>

                    {/* Aggregated Protein Totals */}
                    <div className="flex gap-3 mt-2 pb-2 border-b border-slate-100">
                        {Object.entries(calculateProteinTotals(stats.tomorrowPrepCounts)).map(([protein, count]) => (
                            <div key={protein} className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600">
                                {protein.split(' ')[0]}: {count}
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-slate-500 mt-2 space-y-2">
                        <div>
                            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-100 pb-1 mb-1">
                                <span>Lunch ({calculateMealTypeTotal(stats.tomorrowPrepCounts, 'LUNCH')})</span>
                            </div>
                            {stats.tomorrowPrepCounts?.LUNCH && Object.entries(stats.tomorrowPrepCounts.LUNCH).map(([protein, count]) => (
                                <div key={`L-${protein}`} className="flex justify-between pl-2">
                                    <span>{protein}</span>
                                    <span>{count as number}</span>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-100 pb-1 mb-1">
                                <span>Dinner ({calculateMealTypeTotal(stats.tomorrowPrepCounts, 'DINNER')})</span>
                            </div>
                            {stats.tomorrowPrepCounts?.DINNER && Object.entries(stats.tomorrowPrepCounts.DINNER).map(([protein, count]) => (
                                <div key={`D-${protein}`} className="flex justify-between pl-2">
                                    <span>{protein}</span>
                                    <span>{count as number}</span>
                                </div>
                            ))}
                        </div>
                    </div>
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
