import React from 'react';
import { ADD_ONS } from '../constants';

export const StorySection: React.FC = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12 lg:gap-16">
        
        {/* Left Side: Story */}
        <div className="w-full md:w-2/3">
            <h2 className="font-heading text-5xl md:text-6xl mb-12 text-black drop-shadow-[4px_4px_0_#fff] text-stroke-sm">
                THE ORIGIN STORY
            </h2>
            
            <div className="bg-white border-4 border-black p-8 md:p-10 shadow-hard-lg mb-12 relative overflow-hidden group">
                {/* Halftone pattern overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                <div className="relative z-10">
                    <p className="font-heading text-2xl leading-relaxed mb-6">
                        "WE WERE TIRED OF EATING BORING CHICKEN."
                    </p>
                    <p className="font-body text-xl leading-relaxed border-l-8 border-quirky-pink pl-6 font-bold">
                        The Healthy Canteen isn't a restaurant. It's a <span className="bg-quirky-yellow px-1 border-b-4 border-black">system</span>. 
                        We cook the same way you would if you had the time—fresh, measured, and actually tasty.
                    </p>
                </div>
                
                {/* Comic burst */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-quirky-green rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            </div>

            <div className="flex flex-wrap gap-4">
                {['CONSISTENCY', 'REPETITION', 'GAINS'].map((tag, i) => (
                    <div key={i} className={`border-3 border-black px-6 py-3 font-heading text-xl shadow-hard transform hover:-translate-y-2 transition-transform ${i % 2 === 0 ? 'bg-quirky-blue text-white rotate-2' : 'bg-quirky-yellow text-black -rotate-2'}`}>
                        {tag}
                    </div>
                ))}
            </div>
        </div>

        {/* Right Side: Add Ons */}
        <div className="w-full md:w-1/3 flex">
             <div className="w-full bg-quirky-pink text-white border-4 border-black p-6 md:p-8 rotate-1 hover:rotate-0 transition-transform duration-300 shadow-hard-xl flex flex-col justify-between">
                <div>
                    <h3 className="font-heading text-3xl md:text-4xl mb-8 text-center border-b-4 border-white pb-4 border-dashed drop-shadow-md">
                        EXTRAS 🥤
                    </h3>
                    <ul className="space-y-4 md:space-y-6">
                        {ADD_ONS.map((addon, i) => (
                            <li key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/20 p-4 rounded-xl border-2 border-white/50 backdrop-blur-sm transition-colors hover:bg-black/30">
                                <div className="flex-1 pr-0 sm:pr-2">
                                    <h4 className="font-heading text-xl mb-1">{addon.name}</h4>
                                    <p className="font-body text-sm text-white/90 font-medium leading-snug">{addon.desc}</p>
                                </div>
                                <div className="self-end sm:self-center mt-2 sm:mt-0 shrink-0">
                                    <span className="inline-block font-heading bg-white text-quirky-pink px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-lg transform rotate-2 hover:scale-110 hover:rotate-3 transition-all cursor-default">
                                        {typeof addon.price === 'number' ? `₹${addon.price}` : addon.price}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-8 md:mt-12 text-center p-6 bg-white text-black border-3 border-black shadow-hard transform -rotate-1 hover:rotate-0 transition-transform">
                    <p className="font-heading text-2xl">DELIVERY 🚚</p>
                    <p className="font-body font-bold mt-2 text-lg">Mon-Sat | Afternoon/Evening</p>
                </div>
             </div>
        </div>
      </div>
    </section>
  );
};