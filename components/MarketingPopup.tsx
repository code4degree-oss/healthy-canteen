import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X } from 'lucide-react';

interface PopupSettings {
    popupEnabled: boolean;
    popupTitle: string;
    popupDescription: string;
    popupCountdownText: string;
    popupImage: string;
}

const MarketingPopup: React.FC = () => {
    const [settings, setSettings] = useState<PopupSettings | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Only run once per session
        const hasSeenPopup = sessionStorage.getItem('thc_marketing_popup_seen');
        if (hasSeenPopup === 'true') {
            return;
        }

        const fetchPopupSettings = async () => {
            try {
                const apiBaseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
                const res = await axios.get(`${apiBaseUrl}/settings/popup`);
                const data = res.data;

                if (data.popupEnabled) {
                    setSettings(data);

                    // Trigger popup after 3 seconds
                    setTimeout(() => {
                        setIsVisible(true);
                        sessionStorage.setItem('thc_marketing_popup_seen', 'true');
                    }, 3000);
                }
            } catch (error) {
                console.error("Failed to load popup settings:", error);
            }
        };

        fetchPopupSettings();
    }, []);

    if (!isVisible || !settings) return null;

    const handleClose = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsVisible(false);
    };

    const handleNavigate = () => {
        setIsVisible(false);
        navigate('/order');
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-500"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-lg bg-white rounded-3xl border-4 border-black shadow-hard transform transition-transform hover:scale-[1.02] cursor-pointer overflow-hidden flex flex-col sm:flex-row"
                onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 bg-white border-2 border-black rounded-full p-1.5 hover:bg-quirky-pink hover:text-white transition-colors shadow-hard"
                    title="Close"
                >
                    <X size={20} />
                </button>

                {/* Offer Tag */}
                {settings.popupCountdownText && (
                    <div className="absolute top-4 left-0 bg-quirky-yellow border-y-2 border-r-2 border-black font-heading text-black px-4 py-1 z-10 text-sm md:text-base -rotate-2 shadow-hard">
                        {settings.popupCountdownText}
                    </div>
                )}

                {/* Left Side: Image (only renders if available) */}
                {settings.popupImage && (
                    <div className="sm:w-2/5 h-48 sm:h-auto bg-quirky-green/20 border-b-2 sm:border-b-0 sm:border-r-2 border-black relative overflow-hidden flex-shrink-0">
                        <img
                            src={settings.popupImage.startsWith('http') ? settings.popupImage : `${(import.meta as any).env.VITE_API_URL ? (import.meta as any).env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${settings.popupImage}`}
                            alt="Special Offer"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Right Side: Content */}
                <div className={`p-6 sm:p-8 flex flex-col justify-center text-center sm:text-left ${settings.popupImage ? 'sm:w-3/5' : 'w-full'}`}>
                    <h2 className="font-heading text-2xl md:text-4xl leading-tight mb-3 text-quirky-black">
                        {settings.popupTitle || "SPECIAL OFFER!"}
                    </h2>

                    {settings.popupDescription && (
                        <p className="font-body text-gray-700 mb-6 leading-relaxed text-sm md:text-base">
                            {settings.popupDescription}
                        </p>
                    )}

                    <div className="mt-auto">
                        <div className="inline-block bg-quirky-green border-2 border-black font-heading text-white px-6 py-3 rounded-xl shadow-hard hover:bg-green-500 transition-colors w-full sm:w-auto text-center cursor-pointer uppercase tracking-wider">
                            Build My Plan 🚀
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingPopup;
