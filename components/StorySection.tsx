import React from 'react';
import { ADD_ONS } from '../constants';

export const StorySection: React.FC = () => {
    return (
        <section className="pt-24 pb-0 px-6 max-w-7xl mx-auto overflow-hidden md:overflow-visible">
            <div className="flex flex-col md:flex-row gap-8 items-center relative">

                {/* Left Side: Story (60%) */}
                <div className="w-full md:w-3/5 z-10 relative pb-12">
                    <h2 className="font-heading text-5xl md:text-6xl mb-12 text-black drop-shadow-[4px_4px_0_#fff] text-stroke-sm">
                        THE ORIGIN STORY
                    </h2>

                    <div className="bg-white border-4 border-black p-8 md:p-10 shadow-hard-lg mb-12 relative overflow-hidden group max-w-2xl">
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

                {/* Right Side: Chef Image (40% + Overlap) - Hidden on Mobile */}
                <div className="hidden md:flex w-full md:w-2/5 relative h-full items-end justify-center md:justify-start">
                    <div className="md:absolute md:left-4 md:-bottom-80 md:w-[140%] max-w-none z-0 pointer-events-none">
                        <img
                            src="/chef-brand.png"
                            alt="Chef Cooking"
                            loading="eager"
                            decoding="async"
                            className="w-full h-auto object-contain transform-gpu will-change-transform hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};