import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../src/services/api';
import { Save, Image as ImageIcon, CheckCircle, AlertCircle, X } from 'lucide-react';

interface PopupSettings {
    popupEnabled: boolean;
    popupTitle: string;
    popupDescription: string;
    popupCountdownText: string;
    popupImage: string;
}

const AdminPopupSettings: React.FC = () => {
    const [settings, setSettings] = useState<PopupSettings>({
        popupEnabled: false,
        popupTitle: '',
        popupDescription: '',
        popupCountdownText: '',
        popupImage: ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/settings/popup`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings({
                popupEnabled: res.data.popupEnabled || false,
                popupTitle: res.data.popupTitle || '',
                popupDescription: res.data.popupDescription || '',
                popupCountdownText: res.data.popupCountdownText || '',
                popupImage: res.data.popupImage || ''
            });
            if (res.data.popupImage) {
                setImagePreview(res.data.popupImage.startsWith('http') ? res.data.popupImage : `${API_URL.replace('/api', '')}${res.data.popupImage}`);
            }
        } catch (error) {
            console.error("Failed to fetch popup settings:", error);
            setMessage({ type: 'error', text: 'Failed to fully load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('popupEnabled', String(settings.popupEnabled));
            formData.append('popupTitle', settings.popupTitle);
            formData.append('popupDescription', settings.popupDescription);
            formData.append('popupCountdownText', settings.popupCountdownText);

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (settings.popupImage) {
                formData.append('existingImage', settings.popupImage);
            }

            const res = await axios.put(`${API_URL}/settings/popup`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.popupImage) {
                setSettings(prev => ({ ...prev, popupImage: res.data.popupImage }));
            }
            setMessage({ type: 'success', text: 'Popup settings saved successfully!' });
        } catch (error) {
            console.error("Save error:", error);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div></div>;
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border-4 border-black shadow-hard">
            <h2 className="text-2xl font-heading mb-6 border-b-2 border-black pb-4">Marketing Popup Settings</h2>

            {message && (
                <div className={`p-4 mb-6 border-2 border-black rounded-xl font-body flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="space-y-6 max-w-2xl">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl">
                    <div>
                        <h3 className="font-heading text-lg">Enable Popup</h3>
                        <p className="text-sm text-gray-600">Show this popup to visitors after 3 seconds</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.popupEnabled}
                            onChange={(e) => setSettings({ ...settings, popupEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Title */}
                <div>
                    <label className="block font-heading mb-2">Title <span className="text-quirky-pink">*</span></label>
                    <input
                        type="text"
                        value={settings.popupTitle}
                        onChange={e => setSettings({ ...settings, popupTitle: e.target.value })}
                        className="w-full border-2 border-black p-3 rounded-xl focus:bg-pink-50 outline-none transition-colors"
                        placeholder="e.g. GET 20% OFF YOUR FIRST PLAN!"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block font-heading mb-2">Description</label>
                    <textarea
                        value={settings.popupDescription}
                        onChange={e => setSettings({ ...settings, popupDescription: e.target.value })}
                        className="w-full border-2 border-black p-3 rounded-xl focus:bg-pink-50 outline-none transition-colors h-24 resize-none"
                        placeholder="e.g. Stop eating boring chicken. Subscribe today and get delicious, healthy meals delivered daily."
                    />
                </div>

                {/* Countdown / Offer Text */}
                <div>
                    <label className="block font-heading mb-2">Highlight / Offer Tag</label>
                    <input
                        type="text"
                        value={settings.popupCountdownText}
                        onChange={e => setSettings({ ...settings, popupCountdownText: e.target.value })}
                        className="w-full border-2 border-black p-3 rounded-xl focus:bg-yellow-50 outline-none transition-colors"
                        placeholder="e.g. Limited Time Offer"
                    />
                </div>

                {/* Image */}
                <div>
                    <label className="block font-heading mb-2">Popup Image</label>
                    <div className="border-2 border-dashed border-black rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border-2 border-black" />
                                <button
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                        setSettings({ ...settings, popupImage: '' });
                                    }}
                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 border-2 border-black hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                                <p className="font-heading text-quirky-pink">Click to upload image</p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-quirky-black text-white font-heading text-lg py-4 rounded-xl border-2 border-black hover:bg-gray-800 transition-colors shadow-hard flex items-center justify-center gap-2"
                >
                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20} />}
                    {saving ? 'SAVING...' : 'SAVE POPUP SETTINGS'}
                </button>
            </div>
        </div>
    );
};

export default AdminPopupSettings;
