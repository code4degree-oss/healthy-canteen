import React, { useState, useEffect } from 'react';
import { SIDES } from '../constants';
import { Check, Zap } from 'lucide-react';
import { menu, BASE_URL } from '../src/services/api';

export const MenuShowcase: React.FC = () => {
    // Dynamic Menu State
    const [plans, setPlans] = useState<any[]>([]);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Menu
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await menu.getAll();
                const fetchedPlans = res.data;
                setPlans(fetchedPlans);

                if (fetchedPlans.length > 0) {
                    // Default to first plan and first item
                    const firstPlan = fetchedPlans[0];
                    if (firstPlan.items && firstPlan.items.length > 0) {
                        setSelectedItem(firstPlan.items[0]);
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to load menu", error);
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    // Effect to auto-select first item when plan changes if current item is not in new plan
    // Or we can just let the user select. 
    // But better UX: Select first item of the new plan.
    const handlePlanChange = (index: number) => {
        setCurrentPlanIndex(index);
        const plan = plans[index];
        if (plan && plan.items && plan.items.length > 0) {
            setSelectedItem(plan.items[0]);
        } else {
            setSelectedItem(null);
        }
    };

    if (loading) {
        return (
            <section id="menu" className="py-16 md:py-24 px-4 md:px-6 relative bg-quirky-purple/20 border-y-4 border-black min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
                    <p className="font-heading text-xl">LOADING DELICIOUSNESS...</p>
                </div>
            </section>
        );
    }

    const currentPlan = plans[currentPlanIndex];

    return (
        <section id="menu" className="py-16 md:py-24 px-4 md:px-6 relative bg-quirky-purple/20 border-y-4 border-black">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl lg:text-7xl bg-white border-4 border-black inline-block px-6 py-3 md:px-8 md:py-4 shadow-hard-lg -rotate-2">
                        CHOOSE YOUR FIGHTER
                    </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">

                    {/* Toggles */}
                    <div className="flex flex-col gap-6 w-full lg:w-1/4">
                        {/* Plan Type Tabs */}
                        <div className="grid grid-cols-2 gap-2">
                            {plans.map((plan, index) => (
                                <button
                                    key={plan.id}
                                    onClick={() => handlePlanChange(index)}
                                    className={`py-4 md:py-6 rounded-xl font-heading text-xl border-3 border-black transition-all uppercase ${index === currentPlanIndex ? 'bg-quirky-yellow shadow-hard -rotate-1' : 'bg-white hover:bg-gray-50'}`}
                                >
                                    {plan.name}
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Options (Items List) */}
                        <div className="flex flex-col gap-4 flex-grow">
                            {currentPlan && currentPlan.items && currentPlan.items.length > 0 ? (
                                currentPlan.items.map((item: any) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`flex-1 p-6 md:p-8 border-3 border-black rounded-2xl transition-all relative group overflow-hidden ${selectedItem?.id === item.id ? 'bg-quirky-pink text-white shadow-hard translate-x-1 -translate-y-1' : 'bg-white shadow-hard hover:bg-gray-50'}`}
                                    >
                                        <div className="relative z-10 flex justify-between items-center">
                                            <span className="font-heading text-2xl md:text-3xl uppercase">{item.name}</span>
                                            {selectedItem?.id === item.id && <Check size={28} className="border-2 border-black rounded-full p-0.5 bg-black text-white" />}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 border-3 border-black border-dashed rounded-2xl bg-quirky-green/10 text-center flex flex-col justify-center h-full">
                                    <h3 className="font-heading text-2xl">COMING SOON</h3>
                                    <p className="font-body text-base text-gray-500 mt-2">We're cooking up something special for this plan.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Display */}
                    <div className="w-full lg:w-3/4">
                        <div className={`relative border-4 border-black rounded-3xl p-6 md:p-10 shadow-hard-xl transition-colors duration-500 bg-white`}>

                            {/* Window Controls */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black bg-quirky-pink"></div>
                                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black bg-quirky-yellow"></div>
                                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black bg-quirky-green"></div>
                            </div>

                            {selectedItem ? (
                                <div className="flex flex-col md:flex-row gap-8 items-center mt-6">
                                    <div className="w-full md:w-1/2">
                                        <div className="aspect-square bg-black p-2 rounded-xl border-2 border-black shadow-hard-sm transform rotate-1">
                                            <div className="w-full h-full bg-gray-200 rounded-lg overflow-hidden border-2 border-white relative group">
                                                {selectedItem.image ? (
                                                    <img src={`${BASE_URL}${selectedItem.image}`} alt={selectedItem.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-heading">NO IMAGE</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-4">
                                                    <span className="font-heading text-white text-xl animate-bounce">YUM!</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-1/2 space-y-6">
                                        <div>
                                            <h3 className="font-heading text-3xl md:text-5xl mb-2 text-stroke-sm text-quirky-blue uppercase">{selectedItem.name}</h3>
                                            <div className="h-2 w-24 bg-black rounded-full mb-4"></div>
                                            <p className="font-body text-lg md:text-xl font-bold border-l-4 border-quirky-green pl-4">{selectedItem.description}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 font-heading text-sm">
                                            {selectedItem.calories > 0 && (
                                                <span className="px-3 py-1 bg-yellow-100 border-2 border-black rounded-full">🔥 {selectedItem.calories} CAL</span>
                                            )}
                                            {selectedItem.proteinAmount > 0 && (
                                                <span className="px-3 py-1 bg-red-100 border-2 border-black rounded-full">💪 {selectedItem.proteinAmount}g PROTEIN</span>
                                            )}
                                            <span className="px-3 py-1 bg-green-100 border-2 border-black rounded-full">💰 ₹{selectedItem.price}</span>
                                        </div>

                                        <div className="bg-quirky-cream border-3 border-black p-4 md:p-6 rounded-xl relative shadow-hard-sm">
                                            <div className="absolute -top-4 left-4 bg-quirky-purple text-white border-2 border-black px-3 py-1 font-heading text-xs md:text-sm rotate-2">
                                                SIDE KICKS
                                            </div>
                                            <ul className="font-body text-sm md:text-base space-y-2 mt-2">
                                                {SIDES.slice(0, 4).map((side, i) => (
                                                    <li key={i} className="flex items-center gap-3">
                                                        <Zap size={16} className="text-quirky-black shrink-0" fill="currentColor" />
                                                        <span className="font-bold">{side}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <h3 className="font-heading text-2xl text-gray-400">SELECT AN ITEM TO VIEW DETAILS</h3>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </section >
    );
};