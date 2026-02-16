import React, { useEffect, useState } from 'react';
import { Trash2, Loader, Image as ImageIcon, Copy, RefreshCw } from 'lucide-react';

interface ImageFile {
    name: string;
    url: string;
    size: number;
    date: string;
}

import { BASE_URL } from '../../src/services/api';

const ImageGallery: React.FC = () => {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    // BASE_URL is now imported

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

    const handleDelete = async (filename: string) => {
        if (!confirm('Are you sure? This will permanently delete the image and remove it from any associated menu items or addons.')) return;

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
            alert('Error deleting image');
        } finally {
            setDeleting(null);
        }
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        alert('URL copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl md:text-2xl font-bold font-heading flex items-center gap-2">
                    <ImageIcon className="text-quirky-pink" /> MEDIA GALLERY <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-500 font-body">{images.length}</span>
                </h2>
                <button onClick={fetchImages} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Refresh">
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading && images.length === 0 ? (
                <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-quirky-blue" size={32} /></div>
            ) : images.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-4 border-dashed border-gray-200">
                    <ImageIcon className="mx-auto text-gray-300 mb-4 h-16 w-16" />
                    <p className="text-gray-500 font-heading text-lg">No images in the vault yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {images.map(img => (
                        <div key={img.name} className="group relative bg-white border-2 border-transparent hover:border-black rounded-xl overflow-hidden shadow-sm hover:shadow-hard transition-all duration-200">
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                <img
                                    src={`${BASE_URL}${img.url}`}
                                    alt={img.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => copyUrl(img.url)}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-black shadow-lg transform hover:scale-110 transition-transform"
                                        title="Copy URL"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(img.name)}
                                        className="p-2 bg-white rounded-full hover:bg-red-50 text-red-600 shadow-lg transform hover:scale-110 transition-transform"
                                        title="Delete"
                                    >
                                        {deleting === img.name ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="p-2 bg-white text-[10px] md:text-xs truncate border-t border-gray-100 font-mono text-gray-600">
                                {img.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageGallery;
