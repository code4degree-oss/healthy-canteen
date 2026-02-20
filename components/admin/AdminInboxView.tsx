import React from 'react';
import { Bell, Trash2, Check, Clock, AlertCircle } from 'lucide-react';

interface AdminInboxViewProps {
    notifications: any[];
    loading: boolean;
    onMarkRead: (id: number) => void;
    onDelete: (id: number) => void;
}

export const AdminInboxView: React.FC<AdminInboxViewProps> = ({ notifications, loading, onMarkRead, onDelete }) => {

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertCircle className="text-red-500" />;
            case 'success': return <Check className="text-green-500" />;
            case 'delivery': return <Clock className="text-orange-500" />;
            default: return <Bell className="text-blue-500" />;
        }
    };

    return (
        <div className="animate-in fade-in max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Bell className="text-blue-600" /> Admin Inbox
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Bell size={24} />
                        </div>
                        <h3 className="font-bold text-slate-700">No Notifications</h3>
                        <p className="text-slate-500 text-sm">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-slate-50 transition-colors flex gap-4 ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className="mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{notification.message}</p>

                                    <div className="flex gap-2">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => onMarkRead(notification.id)}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Check size={14} /> Mark Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDelete(notification.id)}
                                            className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                                {!notification.isRead && (
                                    <div className="mt-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
