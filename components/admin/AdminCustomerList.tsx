import React from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';

interface AdminCustomerListProps {
    customers: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setSelectedCustomer: (customer: any) => void;
    setShowCreateUserModal: (show: boolean) => void;
    handleDeleteUser: (id: string) => void;
}

export const AdminCustomerList: React.FC<AdminCustomerListProps> = ({
    customers,
    searchTerm,
    setSearchTerm,
    setSelectedCustomer,
    setShowCreateUserModal,
    handleDeleteUser
}) => {
    const filtered = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

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
                <button onClick={() => setShowCreateUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Plus size={16} /> Add User
                </button>
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
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${sub.protein === 'CHICKEN' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                                                    <span className="text-sm">{sub.protein} ({sub.status})</span>
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
        </div>
    );
};
