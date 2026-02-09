import React from 'react';
import { CONTACT_INFO } from '../constants';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-quirky-black text-white pt-16 pb-8 px-6 mt-12 rounded-t-[3rem] relative overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                <div>
                    <h3 className="font-heading text-3xl mb-4 text-quirky-green">THE HEALTHY CANTEEN</h3>
                    <p className="font-body text-gray-300 mb-6">Good habits, delivered. No more excuses, just good food.</p>
                    <div className="flex gap-4">
                        <a href={`https://instagram.com/${CONTACT_INFO.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="bg-white text-quirky-black p-2 rounded-lg hover:bg-quirky-pink hover:text-white transition-colors">
                            <Instagram />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-heading text-xl mb-4 text-quirky-yellow">CONTACT</h4>
                    <ul className="space-y-4 font-body text-sm">
                        <li className="flex items-center gap-3">
                            <Phone size={18} className="text-quirky-green" />
                            {CONTACT_INFO.phone}
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail size={18} className="text-quirky-green" />
                            {CONTACT_INFO.email}
                        </li>
                        <li className="flex items-start gap-3">
                            <MapPin size={18} className="text-quirky-green flex-shrink-0 mt-1" />
                            {CONTACT_INFO.address}
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-heading text-xl mb-4 text-quirky-pink">THE BORING STUFF</h4>
                    <ul className="space-y-2 font-body text-sm text-gray-400">
                        <li><Link to="/policies" className="hover:text-white cursor-pointer">Terms & Conditions</Link></li>
                        <li><Link to="/policies" className="hover:text-white cursor-pointer">Privacy Policy</Link></li>
                        <li><Link to="/policies" className="hover:text-white cursor-pointer">Refund Policy</Link></li>
                        <li><Link to="/policies" className="hover:text-white cursor-pointer">Shipping Policy</Link></li>
                    </ul>
                </div>
            </div>

            <div className="text-center mt-16 pt-8 border-t border-gray-800 font-body text-xs text-gray-500">
                © {new Date().getFullYear()} The Healthy Canteen. Designed for humans who eat.
            </div>
        </footer>
    );
};