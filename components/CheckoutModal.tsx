import React, { useState } from 'react';
import { PricingTier, ProteinType } from '../types';
import { QuirkyButton } from './QuirkyButton';
import { X, Check, Star } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingTier | null;
  protein: ProteinType;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, plan, protein }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');

  if (!isOpen || !plan) return null;

  const price = protein === ProteinType.CHICKEN ? plan.chickenPrice : plan.paneerPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setStep('success');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="bg-quirky-cream border-4 border-black w-full max-w-lg shadow-[15px_15px_0_0_#fff] relative overflow-hidden flex flex-col max-h-[90vh] transform rotate-1">
        
        {/* Header */}
        <div className="bg-quirky-blue border-b-4 border-black p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
          <h2 className="font-heading text-2xl md:text-3xl text-white text-stroke-black relative z-10">
            {step === 'form' ? 'FINAL BOSS 👾' : 'VICTORY! 🏆'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white hover:bg-red-400 border-3 border-black transition-all hover:scale-110 relative z-10 shadow-hard-sm">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {step === 'form' ? (
            <>
              {/* Order Summary Card */}
              <div className="bg-white border-3 border-black p-5 mb-8 transform -rotate-1 shadow-hard hover:rotate-0 transition-transform">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-heading text-xl">{plan.label}</h3>
                    <div className="flex gap-2 mt-1">
                         <span className="font-heading text-xs bg-black text-white px-2 py-1">{protein}</span>
                         <span className="font-heading text-xs bg-quirky-yellow text-black px-2 py-1 border border-black">LEVEL 1</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-3xl text-quirky-green text-stroke-sm">₹{price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <label className="block font-heading text-sm mb-1 uppercase bg-quirky-pink text-white inline-block px-2 border-2 border-black transform -rotate-2 ml-2">WHO ARE YOU?</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="YOUR NAME" 
                    className="w-full border-3 border-black bg-white p-4 font-heading text-lg focus:outline-none focus:bg-pink-50 focus:shadow-hard transition-all placeholder:text-gray-300"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-heading text-sm mb-1 uppercase ml-1">PHONE</label>
                        <input 
                            required 
                            type="tel" 
                            placeholder="+91..." 
                            className="w-full border-3 border-black bg-white p-4 font-heading focus:outline-none focus:bg-blue-50 focus:shadow-hard transition-all placeholder:text-gray-300"
                        />
                    </div>
                     <div>
                        <label className="block font-heading text-sm mb-1 uppercase ml-1">EMAIL</label>
                        <input 
                            required 
                            type="email" 
                            placeholder="@" 
                            className="w-full border-3 border-black bg-white p-4 font-heading focus:outline-none focus:bg-yellow-50 focus:shadow-hard transition-all placeholder:text-gray-300"
                        />
                    </div>
                </div>

                <div>
                  <label className="block font-heading text-sm mb-1 uppercase bg-quirky-green text-black inline-block px-2 border-2 border-black transform rotate-1 ml-2">DROP LOCATION</label>
                  <textarea 
                    required 
                    rows={3}
                    placeholder="Where do we send the gains?" 
                    className="w-full border-3 border-black bg-white p-4 font-heading text-lg focus:outline-none focus:bg-green-50 focus:shadow-hard transition-all placeholder:text-gray-300 resize-none"
                  ></textarea>
                </div>

                <div className="pt-6">
                  <QuirkyButton type="submit" className="w-full text-xl py-5 hover:scale-[1.02]">
                    PAY ₹{price.toLocaleString()}
                  </QuirkyButton>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-quirky-yellow blur-xl animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-quirky-green border-4 border-black flex items-center justify-center rotate-3 shadow-hard-lg">
                    <Check size={64} className="text-black" strokeWidth={4} />
                  </div>
              </div>
              
              <h3 className="font-heading text-4xl mb-6">MISSION COMPLETE!</h3>
              <p className="font-body text-xl font-bold mb-8 max-w-xs mx-auto">
                We'll contact you faster than you can do a burpee.
              </p>
              <QuirkyButton onClick={onClose} variant="secondary" className="w-full">
                BACK TO BASE
              </QuirkyButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};