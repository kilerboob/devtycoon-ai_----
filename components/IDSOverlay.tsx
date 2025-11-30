/**
 * LAYER 15: IDS Overlay Component
 * Intrusion Detection System - всплывающие уведомления о угрозах
 */

import React, { useState, useEffect, useCallback } from 'react';
import { securityStore, SecurityEvent, ThreatSeverity, ThreatType } from '../services/securityStore';

interface IDSNotification {
  id: string;
  event: SecurityEvent;
  visible: boolean;
  expiresAt: number;
}

interface IDSOverlayProps {
  enabled?: boolean;
  maxNotifications?: number;
  autoHideDelay?: number; // ms
}

const THREAT_ICONS: Record<ThreatType, string> = {
  hack_attempt: '🔓',
  virus_detected: '🦠',
  intrusion: '👤',
  ddos_attack: '🌊',
  data_breach: '📤',
  honeypot_triggered: '🪤',
  suspicious_activity: '👁️',
  malware: '💀',
  brute_force: '🔨',
  phishing: '🎣'
};

const SEVERITY_STYLES: Record<ThreatSeverity, { bg: string; border: string; text: string; glow: string }> = {
  low: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-500',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30'
  },
  medium: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/30'
  },
  high: {
    bg: 'bg-orange-900/90',
    border: 'border-orange-500',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/30'
  },
  critical: {
    bg: 'bg-red-900/90',
    border: 'border-red-500',
    text: 'text-red-400',
    glow: 'shadow-red-500/30'
  }
};

export const IDSOverlay: React.FC<IDSOverlayProps> = ({
  enabled = true,
  maxNotifications = 5,
  autoHideDelay = 8000
}) => {
  const [notifications, setNotifications] = useState<IDSNotification[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Удалить уведомление
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Добавить новое уведомление
  const addNotification = useCallback((event: SecurityEvent) => {
    const notification: IDSNotification = {
      id: event.id,
      event,
      visible: true,
      expiresAt: Date.now() + autoHideDelay
    };

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Автоудаление через delay
    setTimeout(() => {
      removeNotification(event.id);
    }, autoHideDelay);
  }, [autoHideDelay, maxNotifications, removeNotification]);

  // Подписка на события безопасности
  useEffect(() => {
    if (!enabled) return;

    let lastEventId = '';

    const unsubscribe = securityStore.subscribe((state) => {
      // Проверяем новые события
      if (state.events.length > 0 && state.events[0].id !== lastEventId) {
        const newEvent = state.events[0];
        lastEventId = newEvent.id;
        
        // Показываем только если IDS включён и настроен на уведомления
        if (state.idsConfig.enabled && state.idsConfig.notifyOnDetection) {
          addNotification(newEvent);
        }
      }
    });

    return unsubscribe;
  }, [enabled, addNotification]);

  if (!enabled || notifications.length === 0) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg shadow-lg animate-pulse hover:bg-red-700"
        >
          <span>🛡️</span>
          <span className="text-sm font-bold">{notifications.length} угроз</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 space-y-2 pointer-events-none">
      {/* Header */}
      <div className="pointer-events-auto flex items-center justify-between bg-slate-800/95 rounded-t-lg px-3 py-2 border border-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-pulse">🛡️</span>
          <span className="text-white font-semibold text-sm">IDS Monitor</span>
          <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
            {notifications.length}
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-slate-400 hover:text-white text-sm"
        >
          ─
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification, index) => {
          const { event } = notification;
          const styles = SEVERITY_STYLES[event.severity];
          const icon = THREAT_ICONS[event.type];
          
          return (
            <div
              key={notification.id}
              className={`
                pointer-events-auto
                ${styles.bg} ${styles.border} ${styles.glow}
                border rounded-lg p-3 shadow-lg
                transform transition-all duration-300
                hover:scale-[1.02]
                animate-slideIn
              `}
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: notification.visible ? 1 : 0
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className={`font-bold text-sm ${styles.text}`}>
                    {event.type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {event.blocked && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                      BLOCKED
                    </span>
                  )}
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm mb-2">
                {event.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                {event.sourceName && (
                  <span className="flex items-center gap-1">
                    <span>👤</span>
                    <span>{event.sourceName}</span>
                  </span>
                )}
                {event.damageDealt && event.damageDealt > 0 && (
                  <span className="text-red-400">
                    -{event.damageDealt} урона
                  </span>
                )}
              </div>

              {/* Progress bar for auto-hide */}
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${event.blocked ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{
                    width: '100%',
                    animation: `shrink ${autoHideDelay}ms linear forwards`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <div className="pointer-events-auto bg-slate-800/95 rounded-b-lg px-3 py-2 border border-t-0 border-slate-600">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-400">
              ✓ {securityStore.getStats().blockedAttacks} заблокировано
            </span>
            <span className="text-slate-400">
              Уровень угрозы: {securityStore.getState().threatLevel}%
            </span>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default IDSOverlay;
