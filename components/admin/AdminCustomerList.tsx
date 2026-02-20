import React from 'react';
import { Search, Plus, Trash2, Download } from 'lucide-react';

interface AdminCustomerListProps {
    customers: any[];
    total: number;
    totalPages: number;
    currentPage: number;
    setPage: (page: number) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setSelectedCustomer: (customer: any) => void;
    setShowCreateUserModal: (show: boolean) => void;
    handleDeleteUser: (id: string) => void;
}

export const AdminCustomerList: React.FC<AdminCustomerListProps> = ({
    customers,
    total,
    totalPages,
    currentPage,
    setPage,
    searchTerm,
    setSearchTerm,
    setSelectedCustomer,
    setShowCreateUserModal,
    handleDeleteUser
}) => {
    // Client-side filtering logic
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'>('ALL');

    const filtered = customers.filter(customer => {
        if (statusFilter === 'ALL') return true;

        const hasMatchingSub = customer.subscriptions?.some((s: any) => s.status === statusFilter);
        // Special case: If filtering by CANCELLED, maybe check if they have NO active subs? 
        // Or just if they have a cancelled sub? 
        // For simplicity, let's show users who have AT LEAST ONE subscription of that status.
        return hasMatchingSub;
    });

    const handleDownloadCSV = () => {
        // Define Headers
        const headers = [
            "Name",
            "Email",
            "Role",
            "Protein (Plan)",
            "Status",
            "Remaining Days",
            "Plan Purchase Date",
            "Plan Start Date",
            "Meal Types"
        ];

        // Format raw data to rows
        const rows = filtered.map(customer => {
            const activeSub = customer.subscriptions?.find((s: any) => s.status === 'ACTIVE');
            const sub = activeSub || customer.subscriptions?.[0]; // Fallback to first

            let protein = 'No Plan';
            let status = 'Inactive';
            let remainingDays = '0';
            let purchaseDate = '-';
            let startDate = '-';
            let mealTypes = '-';

            if (sub) {
                protein = sub.protein || '-';
                status = sub.status || '-';
                remainingDays = sub.status === 'ACTIVE' ? String(sub.daysRemaining || 0) : '0';

                try {
                    purchaseDate = sub.createdAt ? new Date(sub.createdAt).toISOString().split('T')[0] : '-';
                } catch (e) { purchaseDate = '-'; }

                try {
                    startDate = sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : '-';
                } catch (e) { startDate = '-'; }

                if (sub.mealTypes && Array.isArray(sub.mealTypes)) {
                    mealTypes = sub.mealTypes.join('/');
                } else if (sub.mealTypes) {
                    mealTypes = String(sub.mealTypes);
                } else if (!sub.mealTypes) {
                    mealTypes = 'LUNCH'; // Default legacy fallback
                }
            }

            // Return array matching headers
            // Using ="value" formula syntax for dates to prevent Excel from auto-formatting into #### 
            return [
                `"${customer.name || ''}"`,
                `"${customer.email || ''}"`,
                `"${customer.role || 'user'}"`,
                `"${protein}"`,
                `"${status}"`,
                `"${remainingDays}"`,
                `="${purchaseDate}"`,
                `="${startDate}"`,
                `"${mealTypes}"`
            ];
        });

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `customers_list_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-sm bg-white"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadCSV} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <Download size={16} /> Download CSV
                    </button>
                    <button onClick={() => setShowCreateUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <Plus size={16} /> Add User
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${statusFilter === status
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <th className="px-6 py-4">Name / Contact</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Current Plan</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(customer => (
                            <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{customer.name}</div>
                                    <div className="text-sm text-slate-500">{customer.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${customer.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {customer.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {(() => {
                                        const activeSub = customer.subscriptions?.find((s: any) => s.status === 'ACTIVE');
                                        const sub = activeSub || customer.subscriptions?.[0]; // Fallback to first

                                        if (sub) {
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${sub.protein === 'CHICKEN' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                                                        <span className="text-sm font-medium text-slate-700">{sub.protein}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                            sub.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`} title={sub.cancellationReason ? `Reason: ${sub.cancellationReason}` : ''}>
                                                            {sub.status}
                                                        </span>
                                                        {sub.status === 'CANCELLED' && sub.cancellationReason && (
                                                            <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1 max-w-[100px] truncate" title={sub.cancellationReason}>
                                                                {sub.cancellationReason}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {sub.status === 'ACTIVE' && (
                                                        <span className="text-xs text-slate-500 font-medium ml-4">
                                                            {sub.daysRemaining} days remaining
                                                        </span>
                                                    )}
                                                    {sub.status === 'PAUSED' && (
                                                        <span className="text-xs text-slate-500 font-medium ml-4">
                                                            Paused (Resumes manually)
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return <span className="text-xs text-slate-400">No Plan</span>;
                                    })()}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => setSelectedCustomer(customer)} className="text-blue-600 hover:text-blue-800 text-sm">Details</button>
                                    <button onClick={() => handleDeleteUser(customer.id)} className="text-red-500 hover:text-red-700 text-sm"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <span className="text-sm text-slate-500">
                        Showing page {currentPage} of {totalPages} ({total} total users)
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setPage(currentPage - 1)}
                            className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setPage(currentPage + 1)}
                            className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
