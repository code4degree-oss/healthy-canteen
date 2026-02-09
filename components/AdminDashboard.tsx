import React, { useState, useEffect, useMemo } from 'react';
import { ProteinType, CustomerProfile, MenuItem, AddOn } from '../types';
import { admin, BASE_URL } from '../src/services/api';
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
    const [customers, setCustomers] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]); // New Plans State
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
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);

    // --- Menu/Addon View State ---
    const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
    const [selectedAddOnId, setSelectedAddOnId] = useState<number | null>(null);
    const [newAddOn, setNewAddOn] = useState({ name: '', price: 0, description: '', allowSubscription: false, image: null as File | null });

    // --- Plan/Menu Management State ---
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: '', slug: '' });
    const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [newMenuItem, setNewMenuItem] = useState({
        name: '', slug: '', description: '', proteinAmount: 0, calories: 0, price: 0, color: '#000000', image: null as File | null
    });


    const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

    // FETCH DATA ON MOUNT
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, menuRes, addonsRes, partnersRes] = await Promise.all([
                admin.getAllUsers(),
                admin.getMenu(), // Returns plans with items included
                admin.getAddOns(),
                admin.getDeliveryPartners()
            ]);
            setCustomers(usersRes.data);
            setPlans(menuRes.data); // Set plans (which contain items)
            // Flatten items for table view if needed, or just use plans structure
            const allItems = menuRes.data.flatMap((p: any) => p.items || []);
            setMenuItems(allItems);

            setAddOns(addonsRes.data);
            setDeliveryPartners(partnersRes.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    // Handler for assignment
    const handleAssignDelivery = async (subId: number, partnerId: string) => {
        if (!partnerId) return;
        try {
            await admin.assignDelivery(subId, parseInt(partnerId));
            // Optimistic update or refetch
            fetchData(); // Simplest to refetch to get updated logs
            alert("Delivery Assigned!");
        } catch (e) {
            alert("Failed to assign delivery");
        }
    };

    // --- STATISTICS CALCULATION ---
    const stats = useMemo(() => {
        // Basic stats logic adapting to backend data structure differences if any
        const activeCustomers = customers.filter(c => {
            const activeSub = c.subscriptions?.find((s: any) => s.status === 'ACTIVE');
            return !!activeSub;
        });

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
            const activeSub = c.subscriptions?.find((s: any) => s.status === 'ACTIVE');
            if (activeSub) {
                if (activeSub.protein === 'CHICKEN') chickenMeals += activeSub.mealsPerDay || 0;
                if (activeSub.protein === 'PANEER') paneerMeals += activeSub.mealsPerDay || 0;
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

    const handleMarkReady = async (subId: number) => {
        try {
            await admin.markReady(subId);
            fetchData();
            // Optional: Show toast
        } catch (e) {
            alert("Failed to mark ready");
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

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await admin.createPlan(newPlan);
            setIsPlanModalOpen(false);
            setNewPlan({ name: '', slug: '' });
            fetchData();
            alert('Plan Created!');
        } catch (e) { alert('Failed to create plan'); }
    };

    const handleCreateMenuItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlanId) return alert('Select a plan first');

        const formData = new FormData();
        formData.append('planId', selectedPlanId.toString());
        formData.append('name', newMenuItem.name);
        formData.append('slug', newMenuItem.slug);
        formData.append('description', newMenuItem.description);
        formData.append('proteinAmount', newMenuItem.proteinAmount.toString());
        formData.append('calories', newMenuItem.calories.toString());
        formData.append('price', newMenuItem.price.toString());
        formData.append('color', newMenuItem.color);
        if (newMenuItem.image) formData.append('image', newMenuItem.image);

        try {
            if (selectedItemId) {
                await admin.updateMenuItem(selectedItemId, newMenuItem); // Need to adjust this call to handle FormData if we want image update, but for now JSON update for fields
                // ACTUALLY updateMenuItem in api.ts sends JSON. Let's stick to JSON for updates for now except image.
                // If we want to update image, we need multipart endpoint. 
                // controller `updateMenuItem` expects JSON body. 
                // Let's use `admin.updateMenuItem` which we defined.
                alert('Menu Item Updated!');
            } else {
                await admin.addMenuItem(formData);
                alert('Menu Item Created!');
            }

            setIsMenuItemModalOpen(false);
            // Reset form
            setNewMenuItem({ name: '', slug: '', description: '', proteinAmount: 0, calories: 0, price: 0, color: '#000000', image: null });
            setSelectedItemId(null);
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Failed to save item');
        }
    };

    const handleDeleteMenuItem = async (id: number) => {
        if (confirm('Delete this item?')) {
            try {
                await admin.deleteMenuItem(id);
                fetchData();
            } catch (e) { alert('Failed to delete'); }
        }
    }

    const handleDeletePlan = async (id: number) => {
        if (confirm('Are you sure you want to delete this plan? All items in it will also be deleted.')) {
            try {
                await admin.deletePlan(id);
                fetchData(); // Refresh list
                alert('Plan deleted successfully');
            } catch (e) {
                console.error(e);
                alert('Failed to delete plan');
            }
        }
    };

    const handleUpdatePlan = async () => {
        if (!selectedPlanId) return;
        try {
            await admin.updatePlan(selectedPlanId, { name: newPlan.name });
            setIsPlanModalOpen(false);
            setNewPlan({ name: '', slug: '' });
            setSelectedPlanId(null);
            fetchData();
            alert('Plan Updated!');
        } catch (e) {
            console.error(e);
            alert('Failed to update plan');
        }
    };

    const handleEditItemClick = (item: any) => {
        setNewMenuItem({
            name: item.name,
            slug: item.slug,
            description: item.description,
            proteinAmount: item.proteinAmount,
            calories: item.calories,
            price: item.price,
            color: item.color,
            image: null
        });
        setSelectedItemId(item.id);
        setSelectedPlanId(item.planId);
        setIsMenuItemModalOpen(true);
    };

    const handleSaveAddOn = async () => {
        try {
            const formData = new FormData();
            formData.append('name', newAddOn.name);
            formData.append('price', newAddOn.price.toString());
            formData.append('description', newAddOn.description);
            formData.append('allowSubscription', String(newAddOn.allowSubscription));
            if (newAddOn.image) {
                formData.append('image', newAddOn.image);
            }

            let updatedAddOn;
            if (selectedAddOnId) {
                const res = await admin.updateAddOn(selectedAddOnId, formData);
                updatedAddOn = res.data;
                setAddOns(addOns.map(a => a.id === selectedAddOnId ? updatedAddOn : a));
            } else {
                const res = await admin.addAddOn(formData);
                updatedAddOn = res.data;
                setAddOns([...addOns, updatedAddOn]);
            }

            setIsAddOnModalOpen(false);
            setNewAddOn({ name: '', price: 0, description: '', allowSubscription: false, image: null });
            setSelectedAddOnId(null);
        } catch (error) {
            alert('Failed to save addon');
        }
    };

    const handleEditAddOnClick = (addon: any) => {
        setNewAddOn({
            name: addon.name,
            price: addon.price,
            description: addon.description,
            allowSubscription: addon.allowSubscription,
            image: null // Start with empty file input
        });
        setSelectedAddOnId(addon.id);
        setIsAddOnModalOpen(true);
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

            {/* DAILY DELIVERY DETAILS */}
            <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="text-blue-600" /> Today's Deliveries & Add-ons
                </h2>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">Main Meal</th>
                                <th className="px-4 py-3">Add-Ons</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Driver / Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customers.map(c => {
                                // Find active sub
                                const activeSub = c.subscriptions?.find((s: any) => s.status === 'ACTIVE');
                                if (!activeSub) return null;

                                const activeAddons = activeSub.addons ? Object.keys(activeSub.addons).map(k => {
                                    // Try to find by ID (loose equality for string/number match) or by exact name match
                                    const def = addOns.find(a => a.id == k || a.name === k);
                                    const item = activeSub.addons[k];
                                    if (item.quantity === 0) return null;
                                    // Fallback to key 'k' if definition not found, instead of '?'
                                    return `${def?.name || k} x${item.quantity}`;
                                }).filter(Boolean).join(', ') : '';

                                // Calculate Status Logic Here for Row
                                const todayStr = new Date().toISOString().split('T')[0];
                                const log = activeSub.deliveryLogs?.find((l: any) => new Date(l.deliveryTime).toISOString().startsWith(todayStr));
                                const status = log?.status || 'PENDING';
                                const getStatusBadge = (s: string) => {
                                    switch (s) {
                                        case 'DELIVERED': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Delivered</span>;
                                        case 'ASSIGNED': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Assigned</span>;
                                        case 'READY': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Ready</span>;
                                        default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Not Yet Delivered</span>;
                                    }
                                };

                                return (
                                    <tr key={activeSub.id}>
                                        <td className="px-4 py-3 font-medium">{c.name}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={activeSub.deliveryAddress || c.address}>{activeSub.deliveryAddress || c.address || 'Loc only'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs text-white font-bold ${activeSub.protein === 'CHICKEN' ? 'bg-orange-400' : 'bg-green-400'}`}>
                                                {activeSub.protein}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-medium">
                                            {activeAddons || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-start gap-1">
                                                {getStatusBadge(status)}
                                                {status === 'DELIVERED' && log && (
                                                    <div className="mt-1 text-xs flex flex-col gap-0.5">
                                                        <span className="text-slate-600 flex items-center gap-1">
                                                            🕒 {new Date(log.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {log.latitude && log.longitude && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-500 hover:underline flex items-center gap-1"
                                                            >
                                                                <MapPin size={10} /> Location
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                if (status === 'DELIVERED') {
                                                    return log?.deliveryAgent ? (
                                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                            👤 {log.deliveryAgent.name}
                                                        </span>
                                                    ) : <span className="text-xs text-slate-400">-</span>;
                                                }

                                                if (status === 'PENDING') {
                                                    return (
                                                        <button
                                                            onClick={() => handleMarkReady(activeSub.id)}
                                                            className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded text-xs font-bold border border-orange-200 transition-colors"
                                                        >
                                                            Mark Ready
                                                        </button>
                                                    );
                                                }

                                                // If READY or ASSIGNED, show assignment dropdown
                                                return (
                                                    <div className="flex flex-col gap-1">
                                                        {status === 'READY' && <span className="text-[10px] text-green-600 font-bold">READY FOR PICKUP</span>}
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                className="text-xs border border-slate-300 rounded p-1 max-w-[120px] bg-white shadow-sm"
                                                                value={log?.userId || ''}
                                                                onChange={(e) => handleAssignDelivery(activeSub.id, e.target.value)}
                                                            >
                                                                <option value="">{status === 'ASSIGNED' ? 'Change Driver' : 'Assign Driver'}</option>
                                                                {deliveryPartners.map(dp => (
                                                                    <option key={dp.id} value={dp.id}>{dp.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {status === 'ASSIGNED' && log?.deliveryAgent && (
                                                            <span className="text-[10px] text-blue-600 font-medium">Assigned to: {log.deliveryAgent.name}</span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                )
                            })}
                            {customers.filter(c => c.subscriptions?.some((s: any) => s.status === 'ACTIVE')).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <MapPin size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-slate-900 font-medium mb-1">No Deliveries Today</h3>
                                            <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                                There are no active subscriptions scheduled for delivery today. Use the "Add User" button to create new subscriptions.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </section>
            <hr className="border-slate-200" />

            {/* Menu Management */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" /> Menu Management
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setIsPlanModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800">
                            <Plus size={16} /> New Plan
                        </button>
                        <button onClick={() => setIsMenuItemModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                            <Plus size={16} /> New Item
                        </button>
                    </div>
                </div>

                {/* Plans & Items List */}
                <div className="space-y-8">
                    {plans.map(plan => (
                        <div key={plan.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">{plan.name} <span className="text-xs text-slate-500 font-normal ml-2">({plan.slug})</span></h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setNewPlan({ name: plan.name, slug: plan.slug });
                                            setSelectedPlanId(plan.id);
                                            setIsPlanModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors flex items-center gap-1 text-sm font-medium"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors flex items-center gap-1 text-sm font-medium"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead className="bg-white text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3">Image</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Stats</th>
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3">Price</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {plan.items?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                                        {item.image ? (
                                                            <img src={`${BASE_URL}${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Utensils size={16} /></div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-400">{item.slug}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    <p>{item.calories} kCal</p>
                                                    <p>{item.proteinAmount}g Protein</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={item.description}>
                                                    {item.description}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900">₹{item.price}</td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => handleEditItemClick(item)} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteMenuItem(item.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!plan.items || plan.items.length === 0) && (
                                            <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-sm">No items in this plan yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-xl">
                            <p className="text-slate-500 mb-4">No plans created yet.</p>
                            <button onClick={() => setIsPlanModalOpen(true)} className="text-blue-600 font-bold hover:underline">Create your first plan</button>
                        </div>
                    )}
                </div>

                {/* Addons Section */}
                <div className="mt-12 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 flex justify-between">
                        Manage Add-Ons
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addOns.map(addon => (
                            <div key={addon.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    {(addon as any).image ? (
                                        <img src={`${BASE_URL}${(addon as any).image}`} alt={addon.name} className="w-10 h-10 rounded object-cover border border-slate-100 bg-slate-50" />
                                    ) : (
                                        <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                                            <Utensils size={14} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{addon.name}</p>
                                        <p className="text-xs text-slate-500">₹{addon.price}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleEditAddOnClick(addon)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteAddOn(addon.id as any)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                setNewAddOn({ name: '', price: 0, description: '', allowSubscription: false, image: null });
                                setSelectedAddOnId(null);
                                setIsAddOnModalOpen(true);
                            }}
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

    const handleSubscriptionAction = async (subId: number, action: 'PAUSED' | 'CANCELLED' | 'ACTIVE') => {
        if (!confirm(`Are you sure you want to change status to ${action}?`)) return;
        try {
            await admin.updateSubscription(subId, { status: action });
            // Update local state
            const updatedCustomers = customers.map(c => {
                if (c.subscriptions?.some((s: any) => s.id === subId)) {
                    return {
                        ...c,
                        subscriptions: c.subscriptions.map((s: any) => s.id === subId ? { ...s, status: action } : s)
                    };
                }
                return c;
            });
            setCustomers(updatedCustomers);
            if (selectedCustomer) {
                setSelectedCustomer({ ...selectedCustomer, subscription: { ...selectedCustomer.subscription, status: action } });
            }
            alert(`Subscription ${action}`);
        } catch (e) {
            alert('Failed to update subscription');
        }
    };

    const renderCustomerDetails = () => {
        if (!selectedCustomer) return null;
        // Prefer active subscription, else take top one
        const sub = selectedCustomer.subscriptions?.find((s: any) => s.status === 'ACTIVE') || selectedCustomer.subscriptions?.[0];

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                                {selectedCustomer.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                                <p className="text-sm text-slate-500">{selectedCustomer.email} • {selectedCustomer.phone || 'No Phone'}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={24} /></button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* ACTIVE SUBSCRIPTION */}
                        <section>
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard size={20} className="text-blue-600" /> Active Subscription</h3>
                            {sub ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 px-4 py-2 text-xs font-bold rounded-bl-xl ${sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : sub.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {sub.status}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Plan Type</p>
                                            <p className="font-bold text-lg">{sub.protein} ({sub.mealsPerDay} Meal/Day)</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Dates</p>
                                            <p className="font-medium text-slate-800">{new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Remaining</p>
                                            <p className="font-medium text-slate-800">{sub.daysRemaining} Days / {sub.pausesRemaining} Pauses</p>
                                        </div>
                                    </div>

                                    {/* ADDOONS */}
                                    {sub.addons && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <p className="text-slate-500 text-xs uppercase font-bold mb-2">Active Add-Ons</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.keys(sub.addons).map(key => {
                                                    const item = sub.addons[key];
                                                    const addonDef = addOns.find(a => a.id === parseInt(key)) || { name: 'Unknown' }; // Find name
                                                    if (item.quantity === 0) return null;
                                                    return (
                                                        <span key={key} className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-medium">
                                                            {addonDef.name} x{item.quantity} ({item.frequency})
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* ACTIONS */}
                                    <div className="mt-6 flex gap-3">
                                        {sub.status === 'ACTIVE' && (
                                            <button onClick={() => handleSubscriptionAction(sub.id, 'PAUSED')} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold hover:bg-yellow-200 transition-colors">
                                                Pause Subscription
                                            </button>
                                        )}
                                        {sub.status === 'PAUSED' && (
                                            <button onClick={() => handleSubscriptionAction(sub.id, 'ACTIVE')} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors">
                                                Resume Subscription
                                            </button>
                                        )}
                                        {sub.status !== 'CANCELLED' && (
                                            <button onClick={() => handleSubscriptionAction(sub.id, 'CANCELLED')} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors">
                                                Cancel Plan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No active subscription.</p>
                            )}
                        </section>

                        {/* ORDER HISTORY */}
                        <section>
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-blue-600" /> Order History</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Plan</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedCustomer.orders?.map((order: any) => (
                                            <tr key={order.id}>
                                                <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">{order.protein} / {order.days} Days</td>
                                                <td className="px-4 py-3 text-right">₹{order.totalPrice}</td>
                                                <td className="px-4 py-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{order.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) && (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-400">No previous orders</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-professional text-slate-900 flex overflow-hidden">

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
                    {renderCustomerDetails()}
                </div>
            </main>

            {/* CREATE USER MODAL */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input name="name" placeholder="Full Name" required className="w-full p-2 border rounded" />
                            <input name="email" type="email" placeholder="Email Address" required className="w-full p-2 border rounded" />
                            <input name="phone" placeholder="Phone Number" className="w-full p-2 border rounded" />
                            <select name="role" className="w-full p-2 border rounded">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="delivery">Delivery Partner (Rider)</option>
                                <option value="kitchen">Kitchen Staff</option>
                            </select>
                            <input name="password" type="password" placeholder="Password" required className="w-full p-2 border rounded" />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD PLAN MODAL */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">{selectedPlanId ? 'Edit Plan' : 'Create New Plan Type'}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); selectedPlanId ? handleUpdatePlan() : handleCreatePlan(e); }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Plan Name (e.g. Keto Plan)</label>
                                <input value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Slug (e.g. KETO)</label>
                                <input value={newPlan.slug} onChange={e => setNewPlan({ ...newPlan, slug: e.target.value })} className="w-full p-2 border rounded uppercase" required disabled={!!selectedPlanId} />
                                {selectedPlanId && <p className="text-[10px] text-slate-400 mt-1">Slug cannot be changed after creation.</p>}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => { setIsPlanModalOpen(false); setSelectedPlanId(null); setNewPlan({ name: '', slug: '' }); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">{selectedPlanId ? 'Update Plan' : 'Create Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD MENU ITEM MODAL */}
            {isMenuItemModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{selectedItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                        <form onSubmit={handleCreateMenuItem} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Select Plan</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={selectedPlanId || ''}
                                    onChange={e => setSelectedPlanId(parseInt(e.target.value))}
                                    required
                                    disabled={!!selectedItemId} // Disable moving plans for now
                                >
                                    <option value="">-- Choose Plan --</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                    <input value={newMenuItem.name} onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })} className="w-full p-2 border rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Slug (Unique ID)</label>
                                    <input value={newMenuItem.slug} onChange={e => setNewMenuItem({ ...newMenuItem, slug: e.target.value })} className="w-full p-2 border rounded uppercase" required disabled={!!selectedItemId} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                <textarea value={newMenuItem.description} onChange={e => setNewMenuItem({ ...newMenuItem, description: e.target.value })} className="w-full p-2 border rounded" rows={3} required />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Price (₹)</label>
                                    <input type="number" value={newMenuItem.price} onChange={e => setNewMenuItem({ ...newMenuItem, price: parseInt(e.target.value) })} className="w-full p-2 border rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Protein (g)</label>
                                    <input type="number" value={newMenuItem.proteinAmount} onChange={e => setNewMenuItem({ ...newMenuItem, proteinAmount: parseInt(e.target.value) })} className="w-full p-2 border rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Calories</label>
                                    <input type="number" value={newMenuItem.calories} onChange={e => setNewMenuItem({ ...newMenuItem, calories: parseInt(e.target.value) })} className="w-full p-2 border rounded" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Theme Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={newMenuItem.color} onChange={e => setNewMenuItem({ ...newMenuItem, color: e.target.value })} className="h-10 w-20 p-1 border rounded" />
                                    <input value={newMenuItem.color} onChange={e => setNewMenuItem({ ...newMenuItem, color: e.target.value })} className="flex-1 p-2 border rounded" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Upload Image {selectedItemId && '(Leave empty to keep current)'}</label>
                                <input type="file" accept="image/*" onChange={e => setNewMenuItem({ ...newMenuItem, image: e.target.files?.[0] || null })} className="w-full p-2 border rounded bg-slate-50" />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => { setIsMenuItemModalOpen(false); setSelectedItemId(null); setNewMenuItem({ name: '', slug: '', description: '', proteinAmount: 0, calories: 0, price: 0, color: '#000000', image: null }); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{selectedItemId ? 'Update Item' : 'Save Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ADDON MODAL */}
            {isAddOnModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{selectedAddOnId ? 'Edit Add-On' : 'Add New Add-On'}</h2>
                        <div className="space-y-4">
                            <input placeholder="Name (e.g., Kefir)" value={newAddOn.name} onChange={e => setNewAddOn({ ...newAddOn, name: e.target.value })} className="w-full p-2 border rounded" />
                            <input type="number" placeholder="Price" value={newAddOn.price} onChange={e => setNewAddOn({ ...newAddOn, price: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
                            <textarea placeholder="Description" value={newAddOn.description} onChange={e => setNewAddOn({ ...newAddOn, description: e.target.value })} className="w-full p-2 border rounded" rows={2} />

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Image</label>
                                <input type="file" accept="image/*" onChange={e => setNewAddOn({ ...newAddOn, image: e.target.files?.[0] || null })} className="w-full p-2 border rounded bg-slate-50" />
                            </div>

                            {/* Allow Subscription Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="allowSub"
                                    checked={newAddOn.allowSubscription}
                                    onChange={e => setNewAddOn({ ...newAddOn, allowSubscription: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="allowSub" className="text-sm text-slate-700">Allow as Subscription Add-on?</label>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setIsAddOnModalOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button onClick={handleSaveAddOn} className="px-4 py-2 bg-blue-600 text-white rounded">
                                    {selectedAddOnId ? 'Update Item' : 'Add Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};