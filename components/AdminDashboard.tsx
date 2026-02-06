import React, { useState, useEffect, useMemo } from 'react';
import { ProteinType, CustomerProfile, MenuItem, AddOn } from '../types';
import { admin } from '../src/services/api';
import {
    ArrowLeft, Search, Users, Edit2, Save, X,
    ChevronRight, Calendar, MapPin, Phone, Mail,
    CreditCard, LayoutDashboard, Utensils, TrendingUp,
    Activity, DollarSign, ClipboardList, ChefHat, AlertCircle, Menu, Plus, Trash2
} from 'lucide-react';

interface AdminDashboardProps {
    onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'customers' | 'menu'>('dashboard');

    // Dynamic Data State
    const [customers, setCustomers] = useState<any[]>([]); // Using any for now to align with backend User model structure
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [loading, setLoading] = useState(true);

    // Responsive Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- Customer View State ---
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
    const [showCreateUserModal, setShowCreateUserModal] = useState(false); // For creating new users

    // --- Menu/Addon View State ---
    const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
    const [newAddOn, setNewAddOn] = useState({ name: '', price: 0, description: '', allowSubscription: false });

    // FETCH DATA ON MOUNT
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, menuRes, addonsRes] = await Promise.all([
                admin.getAllUsers(),
                admin.getMenu(),
                admin.getAddOns()
            ]);
            setCustomers(usersRes.data);
            setMenuItems(menuRes.data);
            setAddOns(addonsRes.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    // --- STATISTICS CALCULATION ---
    const stats = useMemo(() => {
        // Basic stats logic adapting to backend data structure differences if any
        const activeCustomers = customers.filter(c => c.subscription && c.subscription.status === 'ACTIVE');

        // Revenue calculation assumes we track it, but backend User model has orderHistory relation. 
        // If backend returns populated orders, we use them.
        const totalRevenue = customers.reduce((sum, c) => {
            const orderSum = c.orders ? c.orders.reduce((oSum: number, order: any) => oSum + parseFloat(order.totalPrice || 0), 0) : 0;
            return sum + orderSum;
        }, 0);

        let chickenMeals = 0;
        let paneerMeals = 0;
        let totalAddons = 0;

        activeCustomers.forEach(c => {
            // Need to check where orders/subscription data comes from. 
            // Assuming 'subscription' is a single object on User.
            if (c.subscription) {
                if (c.subscription.protein === 'CHICKEN') chickenMeals += c.subscription.mealsPerDay || 0;
                if (c.subscription.protein === 'PANEER') paneerMeals += c.subscription.mealsPerDay || 0;
                // Addons logic might be complex if stored as JSON or relation. Assuming simple array or not implemented fully yet.
                // For MVP seed, let's skip complex addon stats if data missing.
            }
        });

        const allOrders = customers.flatMap(c => (c.orders || []).map((o: any) => ({
            ...o,
            customerName: c.name,
            date: new Date(o.createdAt).toLocaleDateString(),
            amount: parseFloat(o.totalPrice),
            description: `${o.days} Days`
        })));
        const recentOrders = allOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

        return {
            activeCount: activeCustomers.length,
            totalRevenue,
            chickenMeals,
            paneerMeals,
            totalAddons,
            recentOrders
        };
    }, [customers]);


    // --- HANDLERS ---
    const handleEditClick = () => {
        setEditForm(JSON.parse(JSON.stringify(selectedCustomer)));
        setIsEditing(true);
    };

    const handleSaveCustomer = () => {
        if (!editForm) return;
        // API Call to update user
        // For now just update local state to reflect UI change (API update endpoint not fully detailed in request but we have generic update if needed, or just skip editing User DETAILS for now and focus on View). 
        // Actually AdminController has deleteUser but createUser. Update logic might be missing. 
        // Let's implement Delete.

        setCustomers(customers.map(c => c.id === editForm.id ? editForm : c));
        setSelectedCustomer(editForm);
        setIsEditing(false);
        setEditForm(null);
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            try {
                await admin.deleteUser(id);
                setCustomers(customers.filter(c => c.id !== id));
                setSelectedCustomer(null);
            } catch (e) {
                alert('Failed to delete user');
            }
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for new user form
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await admin.createUser(data);
            setCustomers([...customers, res.data.user]);
            setShowCreateUserModal(false);
            alert('User created successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to create user.');
        }
    };

    const handleUpdateMenu = async (id: number, field: string, value: any) => {
        // Optimistic update
        const updatedItems = menuItems.map(item => item.id === id ? { ...item, [field]: value } : item);
        setMenuItems(updatedItems);

        try {
            const item = updatedItems.find(i => i.id === id);
            if (item) await admin.updateMenuItem(id, item);
        } catch (error) {
            console.error("Failed to update menu", error);
            fetchData(); // Revert on fail
        }
    };

    const handleAddAddOn = async () => {
        try {
            const res = await admin.addAddOn(newAddOn);
            setAddOns([...addOns, res.data]);
            setIsAddOnModalOpen(false);
            setNewAddOn({ name: '', price: 0, description: '', allowSubscription: false });
        } catch (error) {
            alert('Failed to add addon');
        }
    };

    const handleDeleteAddOn = async (id: number) => {
        if (confirm('Delete this add-on?')) {
            try {
                await admin.deleteAddOn(id);
                setAddOns(addOns.filter(a => a.id !== id));
            } catch (e) { alert('Failed to delete'); }
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // --- RENDERERS ---

    const renderDashboardOverview = () => (
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
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.chickenMeals + stats.paneerMeals}</p>
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
                    {stats.recentOrders.length === 0 && <div className="p-6 text-center text-slate-400">No recent activity</div>}
                </div>
            </div>
        </div>
    );

    const renderKitchenMenu = () => (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Daily Prep Sheet */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ChefHat className="text-blue-600" /> Today's Prep Sheet
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-orange-800 font-medium text-sm">CHICKEN MEALS</p>
                            <p className="text-4xl font-bold text-orange-900 mt-2">{stats.chickenMeals}</p>
                        </div>
                        <Utensils size={40} className="text-orange-300" />
                    </div>
                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-green-800 font-medium text-sm">PANEER MEALS</p>
                            <p className="text-4xl font-bold text-green-900 mt-2">{stats.paneerMeals}</p>
                        </div>
                        <Utensils size={40} className="text-green-300" />
                    </div>
                </div>
            </section>

            <hr className="border-slate-200" />

            {/* Menu Management */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="text-blue-600" /> Menu Management
                </h2>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Calories</th>
                                <th className="px-6 py-4">Protein (g)</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {menuItems.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-slate-300 rounded text-sm"
                                            value={item.calories}
                                            onChange={(e) => handleUpdateMenu(item.id, 'calories', parseInt(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-slate-300 rounded text-sm"
                                            value={item.protein}
                                            onChange={(e) => handleUpdateMenu(item.id, 'protein', parseInt(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <textarea
                                            className="w-full p-2 border border-slate-300 rounded text-sm resize-none"
                                            rows={2}
                                            value={item.description}
                                            onChange={(e) => handleUpdateMenu(item.id, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-slate-300 rounded text-sm"
                                            value={item.price}
                                            onChange={(e) => handleUpdateMenu(item.id, 'price', parseInt(e.target.value))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Addons Section */}
                <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 flex justify-between">
                        Manage Add-Ons
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addOns.map(addon => (
                            <div key={addon.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div>
                                    <p className="font-bold text-sm text-slate-900">{addon.name}</p>
                                    <p className="text-xs text-slate-500">₹{addon.price}</p>
                                </div>
                                <button onClick={() => handleDeleteAddOn(addon.id as any)} className="p-2 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setIsAddOnModalOpen(true)}
                            className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            + Add New Item
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderCustomerList = () => {
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
                                        {customer.subscription ? (
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${customer.subscription.protein === 'CHICKEN' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                                                <span className="text-sm">{customer.subscription.protein}</span>
                                            </div>
                                        ) : <span className="text-xs text-slate-400">No Plan</span>}
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden">

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-screen shrink-0`}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">A</div>
                        <span className="font-semibold text-white tracking-wide">THC ADMIN</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><X size={20} /></button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                        <LayoutDashboard size={20} /> Overview
                    </button>
                    <button onClick={() => setActiveView('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'customers' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Users size={20} /> Customers / Admins
                    </button>
                    <button onClick={() => setActiveView('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'menu' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Utensils size={20} /> Kitchen & Menu
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Exit to Client App
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden">
                    <button onClick={toggleSidebar} className="text-slate-700"> <Menu size={24} /> </button>
                    <span className="font-bold text-slate-900">Admin Panel</span>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {activeView === 'dashboard' && renderDashboardOverview()}
                    {activeView === 'customers' && renderCustomerList()}
                    {activeView === 'menu' && renderKitchenMenu()}
                </div>
            </main>

            {/* CREATE USER MODAL */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input name="name" placeholder="Full Name" required className="w-full p-2 border rounded" />
                            <input name="email" type="email" placeholder="Email" required className="w-full p-2 border rounded" />
                            <input name="password" type="password" placeholder="Password" required className="w-full p-2 border rounded" />
                            <select name="role" className="w-full p-2 border rounded">
                                <option value="user">User (Client)</option>
                                <option value="delivery">Delivery Partner</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ADDON MODAL */}
            {isAddOnModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Add-On</h2>
                        <div className="space-y-4">
                            <input placeholder="Name (e.g., Kefir)" value={newAddOn.name} onChange={e => setNewAddOn({ ...newAddOn, name: e.target.value })} className="w-full p-2 border rounded" />
                            <input type="number" placeholder="Price" value={newAddOn.price} onChange={e => setNewAddOn({ ...newAddOn, price: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
                            <textarea placeholder="Description" value={newAddOn.description} onChange={e => setNewAddOn({ ...newAddOn, description: e.target.value })} className="w-full p-2 border rounded" rows={2} />
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setIsAddOnModalOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button onClick={handleAddAddOn} className="px-4 py-2 bg-blue-600 text-white rounded">Add Item</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};