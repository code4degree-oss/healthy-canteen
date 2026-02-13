import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { notifications } from '../../src/services/api';

export const AdminNotificationsView: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'alert' | 'success'>('info');
    const [isSending, setIsSending] = useState(false);
    const [sentHistory, setSentHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await notifications.getSent();
            setSentHistory(res.data);
        } catch (e) {
            console.error("Failed to fetch sent history");
        }
    };

    const handleSend = async () => {
        if (!title || !message) return alert("Title and message required");
        // eslint-disable-next-line no-restricted-globals
        if (!confirm("Send this message to ALL users?")) return;

        setIsSending(true);
        try {
            await notifications.broadcast({ title, message, type });
            alert("Broadcast Sent!");
            setTitle('');
            setMessage('');
            fetchHistory(); // Refresh list
        } catch (e) {
            alert("Failed to send broadcast");
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (broadcast: any) => {
        // Feature removed
    };

    return (
        <div className="animate-in fade-in max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Bell className="text-blue-600" /> Broadcast Notifications</h2>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Special Offer! 🎉"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Type your message here..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                        <div className="flex gap-4">
                            {(['info', 'alert', 'success'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`px-4 py-2 rounded-lg border-2 font-medium capitalize ${type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isSending ? 'Sending...' : <><Send size={20} /> SEND TO EVERYONE</>}
                    </button>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">Previously Sent Broadcasts</h3>
                <div className="space-y-4">
                    {sentHistory.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                            <div className={`p-3 rounded-full h-fit shrink-0 ${item.type === 'alert' ? 'bg-red-100 text-red-600' : item.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                {item.type === 'alert' ? <AlertTriangle size={20} /> : item.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                <p className="text-slate-600 text-sm mb-3">{item.message}</p>
                                <div className="flex gap-4 text-xs text-slate-400 font-bold uppercase tracking-wide">
                                    <span>Sent: {new Date(item.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>Recipients: {item.count} Users</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sentHistory.length === 0 && <div className="text-center text-slate-400 py-8">No broadcasts sent yet.</div>}
                </div>
            </div>
        </div>
    );
};
