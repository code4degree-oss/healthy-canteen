import React, { useEffect, useState } from 'react';
import { Trash2, Loader, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';
import { BASE_URL } from '../../src/services/api';

interface ImageFile {
    name: string;
    url: string;
    size: number;
    date: string;
}

interface ImagePickerProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onSelect, onClose }) => {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);



    const fetchImages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/admin/images`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setImages(data);
            }
        } catch (error) {
            console.error("Failed to load images", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleDelete = async (e: React.MouseEvent, filename: string) => {
        e.stopPropagation(); // Prevent selection when clicking delete
        if (!confirm('Permanently delete this image?')) return;

        setDeleting(filename);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/admin/images/${filename}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setImages(prev => prev.filter(img => img.name !== filename));
            } else {
                alert('Failed to delete image');
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                        <ImageIcon className="text-quirky-pink" size={20} />
                        Select Image
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchImages} className="p-2 hover:bg-gray-200 rounded-full" title="Refresh">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    {loading && images.length === 0 ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader className="animate-spin text-quirky-blue" />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <ImageIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                            <p>No images found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {images.map(img => (
                                <div
                                    key={img.name}
                                    onClick={() => onSelect(img.url)}
                                    className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-quirky-blue transition-all"
                                >
                                    <img
                                        src={`${BASE_URL}${img.url}`}
                                        alt={img.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-start justify-end p-1 opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={(e) => handleDelete(e, img.name)}
                                            className="p-1.5 bg-white/90 text-red-600 rounded-full hover:bg-red-50 shadow-sm"
                                            title="Delete"
                                        >
                                            {deleting === img.name ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>

                                    {/* Selection Indicator */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                        <span className="bg-quirky-blue/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            Select
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImagePicker;
