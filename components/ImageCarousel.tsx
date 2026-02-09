import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../src/services/api';

interface ImageCarouselProps {
    images: string[];
    alt: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset currentIndex when images change (e.g., switching menu items)
    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    // Auto-rotate logic
    useEffect(() => {
        if (images.length <= 1) return;

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Always auto-rotate (on mobile and desktop)
        // On desktop, it will pause when not hovering and resume on hover
        const isMobile = window.innerWidth < 768;

        // Start auto-rotate: always on mobile, or when hovering on desktop
        if (isMobile || isHovering) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
            }, 3000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [images.length, isHovering]);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-heading">
                NO IMAGE
            </div>
        );
    }

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Images */}
            {images.map((img, index) => (
                <img
                    key={index}
                    src={`${BASE_URL}${img}`}
                    alt={`${alt} - ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            ))}

            {/* Dots Indicator */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full border border-white transition-all ${index === currentIndex
                                ? 'bg-white scale-125'
                                : 'bg-white/50 hover:bg-white/80'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
