import React, { useEffect, useState } from 'react';
import { Notification } from '../types';

interface NotificationContainerProps {
    notifications: Notification[];
    onDismiss: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
    const [visible, setVisible] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Show new notifications
        notifications.forEach(notif => {
            if (!visible.has(notif.id)) {
                setVisible(prev => new Set(prev).add(notif.id));

                // Auto-dismiss after duration
                const duration = notif.duration || 5000;
                setTimeout(() => {
                    setVisible(prev => {
                        const next = new Set(prev);
                        next.delete(notif.id);
                        return next;
                    });
                    setTimeout(() => onDismiss(notif.id), 300); // Wait for animation
                }, duration);
            }
        });
    }, [notifications, visible, onDismiss]);

    const getTypeStyles = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-900/90 border-green-500 text-green-100';
            case 'error':
                return 'bg-red-900/90 border-red-500 text-red-100';
            case 'warning':
                return 'bg-yellow-900/90 border-yellow-500 text-yellow-100';
            case 'achievement':
                return 'bg-purple-900/90 border-purple-500 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.5)]';
            default:
                return 'bg-slate-900/90 border-slate-500 text-slate-100';
        }
    };

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'achievement': return '🏆';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
            {notifications.map(notif => (
                <div
                    key={notif.id}
                    className={`
            pointer-events-auto
            min-w-[300px] max-w-[400px]
            p-4 rounded-lg border-2
            backdrop-blur-md
            transition-all duration-300
            ${visible.has(notif.id) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
            ${getTypeStyles(notif.type)}
          `}
                >
                    <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                            {notif.icon || getTypeIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm mb-1">{notif.title}</div>
                            <div className="text-xs opacity-90">{notif.message}</div>
                        </div>
                        <button
                            onClick={() => {
                                setVisible(prev => {
                                    const next = new Set(prev);
                                    next.delete(notif.id);
                                    return next;
                                });
                                setTimeout(() => onDismiss(notif.id), 300);
                            }}
                            className="text-xl opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
