import React, { useState } from 'react';
import { OrderConfig, AddOn } from '../types';
import { ADD_ONS } from '../constants';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Check, Plus, Minus } from 'lucide-react';

interface CheckoutPageProps {
  orderConfig: OrderConfig;
  onBack: () => void;
}

// Razorpay type definition for window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ orderConfig, onBack }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  const toggleAddon = (id: string, price: number) => {
    // For now simple toggle or increment? Let's do simple toggle for boolean presence or counter
    // Let's implement a counter for addons
    setSelectedAddons(prev => {
        const current = prev[id] || 0;
        return { ...prev, [id]: current + 1 };
    });
  };

  const removeAddon = (id: string) => {
      setSelectedAddons(prev => {
          const current = prev[id] || 0;
          if (current <= 0) return prev;
          return { ...prev, [id]: current - 1 };
      });
  };

  const calculateAddonTotal = () => {
      return ADD_ONS.reduce((total, addon) => {
          const count = selectedAddons[addon.id] || 0;
          const price = typeof addon.price === 'number' ? addon.price : 0;
          return total + (count * price);
      }, 0);
  };

  const grandTotal = orderConfig.totalPrice + calculateAddonTotal();

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.Razorpay) {
        alert("Razorpay SDK not loaded. Check internet connection.");
        return;
    }

    const options = {
        key: "YOUR_RAZORPAY_KEY", // Replace with actual key in production
        amount: grandTotal * 100, // Amount in paisa
        currency: "INR",
        name: "The Healthy Canteen",
        description: `${orderConfig.days} Days - ${orderConfig.protein} Plan`,
        image: "https://example.com/logo.png",
        handler: function (response: any) {
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
            // Here you would redirect to success page or clear cart
        },
        prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone
        },
        theme: {
            color: "#a3e635"
        }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="min-h-screen bg-quirky-cream p-4 md:p-8 pt-24 pb-24">
       
       <button 
         onClick={onBack}
         className="fixed top-6 left-6 z-50 bg-white border-3 border-black p-3 rounded-full shadow-hard hover:scale-110 transition-transform"
       >
         <ArrowLeft size={24} />
       </button>

       <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: Details Form */}
          <div>
              <h2 className="font-heading text-4xl mb-8 flex items-center gap-3">
                  DETAILS 📝
              </h2>
              
              <form id="checkout-form" onSubmit={handlePayment} className="space-y-6 bg-white border-4 border-black p-8 rounded-3xl shadow-hard-lg">
                  <div>
                      <label className="font-heading text-sm mb-2 block uppercase">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-blue-50 focus:shadow-hard transition-all"
                        placeholder="Gym Rat"
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-heading text-sm mb-2 block uppercase">Phone</label>
                        <input 
                            required
                            type="tel" 
                            value={form.phone}
                            onChange={e => setForm({...form, phone: e.target.value})}
                            className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-green-50 focus:shadow-hard transition-all"
                            placeholder="98765..."
                        />
                      </div>
                      <div>
                        <label className="font-heading text-sm mb-2 block uppercase">Email</label>
                        <input 
                            required
                            type="email" 
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-yellow-50 focus:shadow-hard transition-all"
                            placeholder="@"
                        />
                      </div>
                  </div>
                  <div>
                      <label className="font-heading text-sm mb-2 block uppercase">Delivery Address</label>
                      <textarea 
                        required
                        rows={4}
                        value={form.address}
                        onChange={e => setForm({...form, address: e.target.value})}
                        className="w-full border-3 border-black p-4 rounded-xl font-body focus:outline-none focus:bg-pink-50 focus:shadow-hard transition-all resize-none"
                        placeholder="Full address with landmark..."
                      />
                  </div>
              </form>
          </div>

          {/* RIGHT: Order Summary & Addons */}
          <div className="space-y-8">
              
              {/* Plan Summary */}
              <div className="bg-quirky-yellow border-4 border-black p-6 rounded-3xl shadow-hard transform rotate-1">
                  <h3 className="font-heading text-2xl mb-4 border-b-4 border-black pb-2">ORDER SUMMARY</h3>
                  <div className="space-y-2 font-heading text-lg">
                      <div className="flex justify-between">
                          <span>{orderConfig.days} DAY PLAN ({orderConfig.protein})</span>
                          <span>₹{orderConfig.totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                          <span>{orderConfig.mealsPerDay} Meal(s) / Day</span>
                          <span>-</span>
                      </div>
                  </div>
              </div>

              {/* Addons */}
              <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-hard">
                  <h3 className="font-heading text-2xl mb-6">ADD EXTRAS 🥤</h3>
                  <div className="space-y-4">
                      {ADD_ONS.map(addon => {
                          const count = selectedAddons[addon.id] || 0;
                          return (
                            <div key={addon.id} className="flex items-center justify-between border-2 border-gray-200 p-3 rounded-xl hover:border-black transition-colors">
                                <div>
                                    <p className="font-heading text-lg leading-none">{addon.name}</p>
                                    <p className="font-body text-xs text-gray-500">{addon.desc}</p>
                                    <p className="font-heading text-sm text-quirky-pink mt-1">₹{addon.price}</p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {count > 0 && (
                                        <>
                                            <button 
                                                onClick={() => removeAddon(addon.id)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full border-2 border-black hover:bg-red-200"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="font-heading text-lg w-4 text-center">{count}</span>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => toggleAddon(addon.id, Number(addon.price))}
                                        className="w-8 h-8 flex items-center justify-center bg-quirky-green rounded-full border-2 border-black hover:bg-green-400 shadow-hard-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              </div>

              {/* Total & Pay */}
              <div className="bg-quirky-black text-white p-8 rounded-3xl border-4 border-white shadow-xl">
                  <div className="flex justify-between items-end mb-8">
                      <div>
                          <p className="font-heading text-sm text-gray-400">TOTAL AMOUNT</p>
                          <p className="font-heading text-5xl text-quirky-green">₹{grandTotal.toLocaleString()}</p>
                      </div>
                  </div>
                  
                  <button 
                    type="submit"
                    form="checkout-form"
                    className="w-full bg-white text-black font-heading text-xl py-5 rounded-xl hover:bg-quirky-pink hover:text-white transition-colors border-4 border-transparent hover:border-white"
                  >
                      PAY WITH RAZORPAY
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4 font-body">
                      Secured by Razorpay. No refunds on tasty food.
                  </p>
              </div>

          </div>

       </div>
    </div>
  );
};