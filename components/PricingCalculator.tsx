import React, { useState, useEffect } from 'react';
import { BASE_RATES } from '../constants';
import { ProteinType, OrderConfig } from '../types';
import { QuirkyButton } from './QuirkyButton';
import { Utensils, Zap } from 'lucide-react';

interface PricingCalculatorProps {
  onProceed: (config: OrderConfig) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onProceed }) => {
  const [days, setDays] = useState<number>(6);
  const [mealsPerDay, setMealsPerDay] = useState<number>(1);
  const [protein, setProtein] = useState<ProteinType>(ProteinType.CHICKEN);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Stops for the slider visualization
  const stops = [1, 6, 14, 24];

  useEffect(() => {
    // Dynamic Pricing Logic
    const baseRate = BASE_RATES[protein];
    let multiplier = 1;

    // Bulk discounts logic
    if (days >= 24) multiplier = 0.85; // 15% off
    else if (days >= 14) multiplier = 0.90; // 10% off
    else if (days >= 6) multiplier = 0.95; // 5% off

    const calculatedPrice = Math.round(baseRate * days * mealsPerDay * multiplier);
    setTotalPrice(calculatedPrice);
  }, [days, mealsPerDay, protein]);

  const handleProceed = () => {
    onProceed({
      days,
      mealsPerDay,
      protein,
      basePrice: BASE_RATES[protein],
      totalPrice
    });
  };

  return (
    <section className="py-24 px-6 overflow-hidden bg-quirky-cream border-t-4 border-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 relative">
             <div className="absolute top-1/2 left-0 w-full h-2 bg-black -z-10 transform -rotate-1"></div>
             <h2 className="font-heading text-4xl md:text-6xl bg-quirky-green inline-block px-8 py-4 border-4 border-black rotate-1 shadow-hard">
                BUILD YOUR PLAN 🛠️
            </h2>
        </div>

        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-12 shadow-hard-xl relative overflow-hidden">
             
             {/* Decor */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-quirky-pink rounded-full blur-3xl opacity-20"></div>

             {/* 1. Protein Selection */}
             <div className="mb-12">
                <h3 className="font-heading text-xl mb-6 flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-1 rounded text-sm">STEP 1</span>
                    CHOOSE YOUR FUEL
                </h3>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setProtein(ProteinType.CHICKEN)}
                        className={`flex-1 py-4 border-3 border-black rounded-xl font-heading text-lg transition-all ${protein === ProteinType.CHICKEN ? 'bg-quirky-yellow shadow-hard translate-x-1 translate-y-1' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                        🐔 CHICKEN
                    </button>
                    <button 
                        onClick={() => setProtein(ProteinType.PANEER)}
                        className={`flex-1 py-4 border-3 border-black rounded-xl font-heading text-lg transition-all ${protein === ProteinType.PANEER ? 'bg-quirky-pink text-white shadow-hard translate-x-1 translate-y-1' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                        🧀 PANEER
                    </button>
                </div>
             </div>

             {/* 2. Days Slider */}
             <div className="mb-12">
                 <h3 className="font-heading text-xl mb-8 flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-1 rounded text-sm">STEP 2</span>
                    HOW MANY DAYS? ({days})
                </h3>
                
                <div className="relative px-2 pt-6 pb-10">
                    {/* Slider Stops Markers */}
                    <div className="absolute top-0 left-0 right-0 flex justify-between px-2 font-heading text-xs text-gray-400">
                        {stops.map(stop => (
                             <div 
                                key={stop} 
                                className="flex flex-col items-center cursor-pointer hover:text-black transition-colors"
                                style={{ left: `${((stop-1)/29)*100}%`, position: 'absolute', transform: 'translateX(-50%)' }}
                                onClick={() => setDays(stop)}
                             >
                                <div className={`w-3 h-3 border-2 border-black rounded-full mb-2 ${days >= stop ? 'bg-quirky-green' : 'bg-white'}`}></div>
                                {stop}D
                             </div>
                        ))}
                         <div 
                            className="flex flex-col items-center absolute"
                            style={{ right: '0%', transform: 'translateX(50%)' }}
                         >
                            <div className={`w-3 h-3 border-2 border-black rounded-full mb-2 ${days === 30 ? 'bg-quirky-green' : 'bg-white'}`}></div>
                            30D
                         </div>
                    </div>

                    <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        value={days} 
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="w-full relative z-10"
                    />
                </div>
             </div>

             {/* 3. Meals Per Day */}
             <div className="mb-12">
                <h3 className="font-heading text-xl mb-6 flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-1 rounded text-sm">STEP 3</span>
                    MEALS PER DAY
                </h3>
                <div className="flex gap-4 max-w-sm">
                    <button 
                        onClick={() => setMealsPerDay(1)}
                        className={`flex-1 py-3 border-3 border-black rounded-xl font-heading transition-all ${mealsPerDay === 1 ? 'bg-quirky-blue text-white shadow-hard' : 'bg-white'}`}
                    >
                        JUST LUNCH
                    </button>
                    <button 
                        onClick={() => setMealsPerDay(2)}
                        className={`flex-1 py-3 border-3 border-black rounded-xl font-heading transition-all ${mealsPerDay === 2 ? 'bg-quirky-blue text-white shadow-hard' : 'bg-white'}`}
                    >
                        LUNCH & DINNER
                    </button>
                </div>
             </div>

             {/* Total & Action */}
             <div className="bg-quirky-cream border-3 border-black p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="font-heading text-sm text-gray-500 mb-1">TOTAL ESTIMATE</p>
                    <p className="font-heading text-5xl text-quirky-black text-stroke-sm">₹{totalPrice.toLocaleString()}</p>
                    <p className="font-body text-xs font-bold mt-2 bg-yellow-200 inline-block px-2">
                        ≈ ₹{Math.round(totalPrice / (days * mealsPerDay))} / meal
                    </p>
                </div>
                
                <QuirkyButton onClick={handleProceed} className="w-full md:w-auto text-xl px-12 py-4 animate-wiggle hover:animate-none">
                    PROCEED TO PAY ➔
                </QuirkyButton>
             </div>

        </div>
      </div>
    </section>
  );
};