/**
 * LAYER 15: SecurityApp Component
 * Приложение управления безопасностью DeVOS
 * Firewall, IDS, Honeypots, Security Logs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  securityStore, 
  SecurityState, 
  FirewallLevel, 
  SecurityEvent,
  Honeypot,
  ThreatType,
  ThreatSeverity
} from '../services/securityStore';
import { GameState } from '../types';

interface SecurityAppProps {
  state: GameState;
  onUpdateState: (updates: Partial<GameState>) => void;
  onClose: () => void;
}

type TabType = 'dashboard' | 'firewall' | 'ids' | 'honeypots' | 'logs' | 'guild';

const FIREWALL_LEVELS: { level: FirewallLevel; name: string; icon: string; cost: number }[] = [
  { level: 'OFF', name: 'Отключен', icon: '🔓', cost: 0 },
  { level: 'BASIC', name: 'Базовый', icon: '🛡️', cost: 10 },
  { level: 'STRONG', name: 'Усиленный', icon: '🔰', cost: 50 },
  { level: 'CORPORATE', name: 'Корпоративный', icon: '🏰', cost: 200 }
];

export const SecurityApp: React.FC<SecurityAppProps> = ({ state, onUpdateState, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [securityState, setSecurityState] = useState<SecurityState>(securityStore.getState());
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [guildJoined, setGuildJoined] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [guildError, setGuildError] = useState<string|undefined>();
  const [backendEvents, setBackendEvents] = useState<any[]>([]);
  const [backendLogsLoading, setBackendLogsLoading] = useState(false);

  // Подписка на изменения
  useEffect(() => {
    const unsubscribe = securityStore.subscribe(setSecurityState);
    return unsubscribe;
  }, []);

  // Load guild contracts when tab is active
  useEffect(() => {
    if (activeTab === 'guild') {
      setContractsLoading(true);
      setGuildError(undefined);
      fetch('/api/security-guild/contracts?status=open')
        .then(r => r.json())
        .then(setContracts)
        .catch(e => setGuildError(e.message))
        .finally(() => setContractsLoading(false));
    }
  }, [activeTab]);

  // Статистика
  const stats = useMemo(() => securityStore.getStats(), [securityState]);

  // Фильтрация событий
  const [eventFilter, setEventFilter] = useState<'all' | ThreatSeverity>('all');
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return securityState.events;
    return securityState.events.filter(e => e.severity === eventFilter);
  }, [securityState.events, eventFilter]);

  // Сканирование
  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const result = securityStore.runSecurityScan();
      setIsScanning(false);
      // Можно показать результат
    }, 2000);
  };

  // Изменение уровня файрвола
  const changeFirewallLevel = (level: FirewallLevel) => {
    const config = securityStore.getFirewallConfig(level);
    if (state.money >= config.moneyCost) {
      securityStore.setFirewallLevel(level);
    }
  };

  // Dashboard Tab
  const renderDashboard = () => (
    <div className="p-4 space-y-4">
      {/* Threat Level Indicator */}
      <div className={`p-4 rounded-lg border ${
        securityState.threatLevel >= 80 ? 'bg-red-900/50 border-red-500' :
        securityState.threatLevel >= 50 ? 'bg-orange-900/50 border-orange-500' :
        securityState.threatLevel >= 20 ? 'bg-yellow-900/50 border-yellow-500' :
        'bg-green-900/50 border-green-500'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold">Уровень угрозы</span>
          <span className={`text-2xl font-bold ${
            securityState.threatLevel >= 80 ? 'text-red-400' :
            securityState.threatLevel >= 50 ? 'text-orange-400' :
            securityState.threatLevel >= 20 ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {securityState.threatLevel}%
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              securityState.threatLevel >= 80 ? 'bg-red-500' :
              securityState.threatLevel >= 50 ? 'bg-orange-500' :
              securityState.threatLevel >= 20 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${securityState.threatLevel}%` }}
          />
        </div>
        {securityState.isUnderAttack && (
          <div className="mt-2 flex items-center gap-2 text-red-400 animate-pulse">
            <span>⚠️</span>
            <span>СИСТЕМА ПОД АТАКОЙ!</span>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.blockedAttacks}</div>
          <div className="text-xs text-slate-400">Заблокировано</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.successfulBreaches}</div>
          <div className="text-xs text-slate-400">Прорывов</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.blockRate}%</div>
          <div className="text-xs text-slate-400">Эффективность</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.honeypotTriggered}</div>
          <div className="text-xs text-slate-400">Ловушек сработало</div>
        </div>
      </div>

      {/* Current Protection Status */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Текущая защита</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Firewall</span>
            <span className={`font-medium ${securityState.firewallEnabled ? 'text-green-400' : 'text-red-400'}`}>
              {securityState.firewallLevel} {securityState.firewallEnabled ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">IDS</span>
            <span className={`font-medium ${securityState.idsConfig.enabled ? 'text-green-400' : 'text-red-400'}`}>
              {securityState.idsConfig.sensitivity.toUpperCase()} {securityState.idsConfig.enabled ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Ловушки</span>
            <span className="text-cyan-400">
              {securityState.honeypots.filter(h => h.isActive).length} активных
            </span>
          </div>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={runScan}
        disabled={isScanning}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          isScanning 
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
            : 'bg-cyan-600 hover:bg-cyan-700 text-white'
        }`}
      >
        {isScanning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Сканирование...
          </span>
        ) : (
          <span>🔍 Запустить сканирование</span>
        )}
      </button>

      {/* Recent Events */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Последние события</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {securityState.events.slice(0, 5).map(event => (
            <div 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-2 rounded cursor-pointer hover:bg-slate-700 ${
                event.severity === 'critical' ? 'border-l-4 border-red-500' :
                event.severity === 'high' ? 'border-l-4 border-orange-500' :
                event.severity === 'medium' ? 'border-l-4 border-yellow-500' :
                'border-l-4 border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${event.blocked ? 'text-green-400' : 'text-red-400'}`}>
                  {event.blocked ? '✓ Blocked' : '⚠ Active'}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">{event.description}</p>
            </div>
          ))}
          {securityState.events.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              Нет событий безопасности
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Firewall Tab
  const renderFirewall = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">🔥 DeVOS Firewall</h3>
        <button
          onClick={() => securityStore.toggleFirewall(!securityState.firewallEnabled)}
          className={`px-4 py-2 rounded-lg font-medium ${
            securityState.firewallEnabled 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          {securityState.firewallEnabled ? 'ВКЛ' : 'ВЫКЛ'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIREWALL_LEVELS.map(({ level, name, icon, cost }) => {
          const config = securityStore.getFirewallConfig(level);
          const isActive = securityState.firewallLevel === level;
          const canAfford = state.money >= cost;
          
          return (
            <button
              key={level}
              onClick={() => changeFirewallLevel(level)}
              disabled={!canAfford && !isActive}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive 
                  ? 'border-cyan-500 bg-cyan-900/30' 
                  : canAfford 
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-800' 
                    : 'border-slate-700 bg-slate-900 opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className={`font-bold ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                {name}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                Block: {Math.round(config.blockRate * 100)}%
              </div>
              <div className="text-sm text-slate-400">
                Detect: {Math.round(config.detectRate * 100)}%
              </div>
              {cost > 0 && (
                <div className={`text-sm mt-2 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                  ${cost}/час
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Описание</h4>
        <p className="text-slate-400 text-sm">
          {securityStore.getFirewallConfig().description}
        </p>
      </div>
    </div>
  );

  // IDS Tab
  const renderIDS = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">👁️ Система обнаружения вторжений</h3>
        <button
          onClick={() => securityStore.updateIDSConfig({ enabled: !securityState.idsConfig.enabled })}
          className={`px-4 py-2 rounded-lg font-medium ${
            securityState.idsConfig.enabled 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          {securityState.idsConfig.enabled ? 'ВКЛ' : 'ВЫКЛ'}
        </button>
      </div>

      {/* Sensitivity */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">Чувствительность</h4>
        <div className="flex gap-2">
          {(['low', 'medium', 'high', 'paranoid'] as const).map(level => (
            <button
              key={level}
              onClick={() => securityStore.updateIDSConfig({ sensitivity: level })}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                securityState.idsConfig.sensitivity === level
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <h4 className="text-white font-semibold">Настройки</h4>
        
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-300">Автоблокировка угроз</span>
          <input
            type="checkbox"
            checked={securityState.idsConfig.autoBlock}
            onChange={e => securityStore.updateIDSConfig({ autoBlock: e.target.checked })}
            className="w-5 h-5 rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-300">Уведомления об обнаружении</span>
          <input
            type="checkbox"
            checked={securityState.idsConfig.notifyOnDetection}
            onChange={e => securityStore.updateIDSConfig({ notifyOnDetection: e.target.checked })}
            className="w-5 h-5 rounded"
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Хранить логи (дней)</span>
          <select
            value={securityState.idsConfig.logRetentionDays}
            onChange={e => securityStore.updateIDSConfig({ logRetentionDays: Number(e.target.value) })}
            className="bg-slate-700 text-white px-3 py-1 rounded"
          >
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
        </div>
      </div>

      {/* Blacklist */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">
          Чёрный список ({securityState.idsConfig.blacklistedIds.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {securityState.idsConfig.blacklistedIds.slice(0, 10).map(id => (
            <span key={id} className="px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded">
              {id.substring(0, 8)}...
            </span>
          ))}
          {securityState.idsConfig.blacklistedIds.length === 0 && (
            <span className="text-slate-500 text-sm">Список пуст</span>
          )}
        </div>
      </div>
    </div>
  );

  // Honeypots Tab
  const renderHoneypots = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">🪤 Ловушки (Honeypots)</h3>
        <span className="text-cyan-400">
          {securityState.honeypots.filter(h => h.isActive).length} активных
        </span>
      </div>

      <div className="space-y-3">
        {securityState.honeypots.map(honeypot => (
          <div 
            key={honeypot.id}
            className={`bg-slate-800 rounded-lg p-4 border-l-4 ${
              honeypot.isActive ? 'border-green-500' : 'border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {honeypot.type === 'folder' ? '📁' :
                   honeypot.type === 'lab' ? '🔬' :
                   honeypot.type === 'blueprint' ? '📜' :
                   honeypot.type === 'file' ? '📄' : '🖥️'}
                </span>
                <span className="text-white font-medium">{honeypot.name}</span>
              </div>
              <button
                onClick={() => {
                  const hp = securityState.honeypots.find(h => h.id === honeypot.id);
                  if (hp) hp.isActive = !hp.isActive;
                }}
                className={`px-3 py-1 rounded text-sm ${
                  honeypot.isActive 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-600 text-slate-400'
                }`}
              >
                {honeypot.isActive ? 'Активна' : 'Выключена'}
              </button>
            </div>
            
            {honeypot.path && (
              <div className="text-xs text-slate-500 mb-2">
                📍 {honeypot.path}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Сработала: {honeypot.triggeredCount} раз
              </span>
              <span className="text-cyan-400">
                +{honeypot.rewards.reputation} rep, +{honeypot.rewards.intel} intel
              </span>
            </div>
            
            {honeypot.lastTriggered && (
              <div className="text-xs text-slate-500 mt-1">
                Последний раз: {new Date(honeypot.lastTriggered).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
      >
        ➕ Создать новую ловушку
      </button>
    </div>
  );

  // Logs Tab
  const renderLogs = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">📋 Журнал безопасности</h3>
        <div className="flex items-center gap-2">
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value as any)}
            className="bg-slate-700 text-white px-3 py-1 rounded"
          >
            <option value="all">Все события</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={async () => {
              setBackendLogsLoading(true);
              try {
                const res = await fetch('/api/security/events?limit=50');
                const data = await res.json();
                setBackendEvents(data);
              } finally {
                setBackendLogsLoading(false);
              }
            }}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm"
          >
            Загрузить из backend
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredEvents.map(event => (
          <div 
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className={`bg-slate-800 p-3 rounded-lg cursor-pointer hover:bg-slate-700 border-l-4 ${
              event.severity === 'critical' ? 'border-red-500' :
              event.severity === 'high' ? 'border-orange-500' :
              event.severity === 'medium' ? 'border-yellow-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  event.blocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {event.blocked ? 'BLOCKED' : event.status.toUpperCase()}
                </span>
                <span className="text-slate-400 text-sm">
                  {event.type.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-300">{event.description}</p>
            {event.sourceName && (
              <p className="text-xs text-slate-500 mt-1">
                Источник: {event.sourceName}
              </p>
            )}
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            Нет событий для отображения
          </p>
        )}
      </div>

      <button
        onClick={() => securityStore.clearOldEvents(securityState.idsConfig.logRetentionDays)}
        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
      >
        🗑️ Очистить старые логи
      </button>

      {/* Backend events */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Backend события</h4>
        {backendLogsLoading && <div className="text-slate-400">Загрузка…</div>}
        {!backendLogsLoading && backendEvents.length === 0 && (
          <div className="text-slate-500">Нет событий в базе</div>
        )}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {backendEvents.map((event: any) => (
            <div key={event.id} className="bg-slate-800 p-3 rounded-lg border-l-4 border-cyan-500">
              <div className="flex items-center justify-between mb-1">
                <div className="text-slate-400 text-sm">{event.event_type}</div>
                <span className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-300">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Guild Tab
  const renderGuild = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">🛡️ Гильдия Безопасности</h3>
        {!guildJoined && (
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/security-guild/join', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: state.username || 'player', username: state.username || 'player' })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Join failed');
                setGuildJoined(true);
              } catch (e: any) {
                setGuildError(e.message);
              }
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
          >
            Вступить в гильдию
          </button>
        )}
      </div>

      {guildError && (
        <div className="text-red-400 text-sm">{guildError}</div>
      )}

      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Открытые контракты</h4>
        {contractsLoading && <div className="text-slate-400">Загрузка…</div>}
        {!contractsLoading && contracts.length === 0 && (
          <div className="text-slate-500">Нет открытых контрактов</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contracts.map((c: any) => (
            <div key={c.id} className="bg-slate-700 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">{c.title || `Контракт #${c.id}`}</div>
                <span className="text-xs text-slate-400">{c.status}</span>
              </div>
              {c.description && (
                <div className="text-sm text-slate-300 mt-1">{c.description}</div>
              )}
              <div className="text-xs text-slate-400 mt-2">
                Заказчик: {c.corporation_id || 'N/A'} | Награда: {c.reward_amount || 0}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/security-guild/contracts/${c.id}/assign`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: state.username || 'player' })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Assign failed');
                      setContracts(prev => prev.map(ci => ci.id === c.id ? { ...ci, assigned_to_user_id: state.username, status: 'assigned' } : ci));
                    } catch (e: any) {
                      setGuildError(e.message);
                    }
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded"
                >
                  Назначить мне
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/security-guild/contracts/${c.id}/complete`, { method: 'POST' });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Complete failed');
                      setContracts(prev => prev.map(ci => ci.id === c.id ? { ...ci, status: 'completed', completed_at: new Date().toISOString() } : ci));
                    } catch (e: any) {
                      setGuildError(e.message);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded"
                >
                  Завершить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="h-10 bg-slate-800 flex items-center px-4 justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <span className="font-bold text-white">Security Center</span>
          {securityState.isUnderAttack && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded animate-pulse">
              UNDER ATTACK
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/50 overflow-x-auto">
        {([
          { id: 'dashboard', icon: '📊', label: 'Обзор' },
          { id: 'firewall', icon: '🔥', label: 'Firewall' },
          { id: 'ids', icon: '👁️', label: 'IDS' },
          { id: 'honeypots', icon: '🪤', label: 'Ловушки' },
          { id: 'logs', icon: '📋', label: 'Логи' },
          { id: 'guild', icon: '🏛️', label: 'Гильдия' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'firewall' && renderFirewall()}
        {activeTab === 'ids' && renderIDS()}
        {activeTab === 'honeypots' && renderHoneypots()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'guild' && renderGuild()}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Детали события</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Тип:</span>
                <span className="text-white">{selectedEvent.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Серьёзность:</span>
                <span className={`font-medium ${
                  selectedEvent.severity === 'critical' ? 'text-red-400' :
                  selectedEvent.severity === 'high' ? 'text-orange-400' :
                  selectedEvent.severity === 'medium' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>{selectedEvent.severity.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Статус:</span>
                <span className={selectedEvent.blocked ? 'text-green-400' : 'text-red-400'}>
                  {selectedEvent.blocked ? 'Заблокировано' : selectedEvent.status}
                </span>
              </div>
              {selectedEvent.sourceName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Источник:</span>
                  <span className="text-white">{selectedEvent.sourceName}</span>
                </div>
              )}
              {selectedEvent.targetPath && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Цель:</span>
                  <span className="text-white">{selectedEvent.targetPath}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400">Описание:</span>
                <p className="text-white mt-1">{selectedEvent.description}</p>
              </div>
              <div className="text-xs text-slate-500">
                {new Date(selectedEvent.timestamp).toLocaleString()}
              </div>
            </div>

            {selectedEvent.status !== 'resolved' && !selectedEvent.blocked && (
              <button
                onClick={() => {
                  securityStore.resolveEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                ✓ Отметить как решённое
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityApp;
