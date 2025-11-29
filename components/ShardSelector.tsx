/**
 * ShardSelector - LAYER 4: Выбор сервера
 * 
 * Полноэкранный компонент для выбора шарда (сервера) перед игрой.
 * Показывается после авторизации, если шард ещё не выбран.
 */

import React, { useState, useEffect } from 'react';
import { shardService, Shard, ShardStatus } from '../services/shardService';
import { playSound } from '../utils/sound';

interface ShardSelectorProps {
  onSelect: (shardId: string) => void;
  username: string;
}

export const ShardSelector: React.FC<ShardSelectorProps> = ({ onSelect, username }) => {
  const [shards, setShards] = useState<Shard[]>([]);
  const [selectedShard, setSelectedShard] = useState<string | null>(null);
  const [hoveredShard, setHoveredShard] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'pvp' | 'hardcore'>('all');

  useEffect(() => {
    // Инициализация и загрузка шардов
    const loadShards = async () => {
      await shardService.init();
      setShards(shardService.getShards());
    };
    loadShards();

    // Обновляем данные каждые 5 секунд
    const interval = setInterval(() => {
      setShards(shardService.getShards());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredShards = shards.filter(shard => {
    if (filter === 'all') return true;
    if (filter === 'available') return shard.status === 'online' && shard.population < shard.maxPopulation;
    if (filter === 'pvp') return shard.isPvP;
    if (filter === 'hardcore') return shard.isHardcore;
    return true;
  });

  const handleConnect = async () => {
    if (!selectedShard) return;

    const shard = shards.find(s => s.id === selectedShard);
    if (!shard || shard.status !== 'online') {
      playSound('error');
      return;
    }

    setIsConnecting(true);
    playSound('click');

    // Симуляция подключения
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = await shardService.selectShard(selectedShard, username);
    
    if (success) {
      playSound('success');
      onSelect(selectedShard);
    } else {
      playSound('error');
      setIsConnecting(false);
    }
  };

  const getPopulationColor = (pop: number, max: number): string => {
    const ratio = pop / max;
    if (ratio < 0.5) return 'text-green-400';
    if (ratio < 0.8) return 'text-yellow-400';
    if (ratio < 0.95) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPopulationBar = (pop: number, max: number): string => {
    const ratio = (pop / max) * 100;
    if (ratio < 50) return 'bg-green-500';
    if (ratio < 80) return 'bg-yellow-500';
    if (ratio < 95) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderShardCard = (shard: Shard) => {
    const isSelected = selectedShard === shard.id;
    const isHovered = hoveredShard === shard.id;
    const isAvailable = shard.status === 'online' && shard.population < shard.maxPopulation;

    return (
      <div
        key={shard.id}
        className={`
          relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
          ${isSelected 
            ? 'border-cyan-400 bg-cyan-900/30 shadow-lg shadow-cyan-500/30' 
            : isHovered
              ? 'border-cyan-600/50 bg-gray-800/80'
              : 'border-gray-700 bg-gray-900/50'
          }
          ${!isAvailable ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'}
          ${shard.isHardcore ? 'border-l-4 border-l-red-500' : ''}
        `}
        onClick={() => {
          if (isAvailable) {
            setSelectedShard(shard.id);
            playSound('click');
          }
        }}
        onMouseEnter={() => setHoveredShard(shard.id)}
        onMouseLeave={() => setHoveredShard(null)}
      >
        {/* Статус индикатор */}
        <div 
          className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: shardService.getStatusColor(shard.status) }}
          title={shardService.getStatusText(shard.status)}
        />

        {/* Заголовок */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{shardService.getRegionEmoji(shard.region)}</span>
          <h3 className="text-lg font-bold text-white">{shard.name}</h3>
          {shard.isHardcore && (
            <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">HARDCORE</span>
          )}
          {shard.isPvP && !shard.isHardcore && (
            <span className="px-2 py-0.5 text-xs bg-orange-600 text-white rounded-full">PvP</span>
          )}
        </div>

        {/* Регион и пинг */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
          <span>{shard.region}</span>
          <span className={shardService.getPingClass(shard.ping)}>
            {shard.ping}ms
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700">
            {shardService.getStatusText(shard.status)}
          </span>
        </div>

        {/* Население */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Игроки</span>
            <span className={getPopulationColor(shard.population, shard.maxPopulation)}>
              {shard.population} / {shard.maxPopulation}
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getPopulationBar(shard.population, shard.maxPopulation)} transition-all duration-500`}
              style={{ width: `${(shard.population / shard.maxPopulation) * 100}%` }}
            />
          </div>
        </div>

        {/* Описание */}
        <p className="text-sm text-gray-400 mb-3">{shard.description}</p>

        {/* Множители */}
        <div className="flex gap-3 mb-3">
          <div className={`text-xs px-2 py-1 rounded ${shard.economyMultiplier > 1 ? 'bg-green-900/50 text-green-400' : shard.economyMultiplier < 1 ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
            💰 x{shard.economyMultiplier.toFixed(1)}
          </div>
          <div className={`text-xs px-2 py-1 rounded ${shard.xpMultiplier > 1 ? 'bg-blue-900/50 text-blue-400' : shard.xpMultiplier < 1 ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
            ⭐ x{shard.xpMultiplier.toFixed(1)}
          </div>
        </div>

        {/* Особенности */}
        <div className="flex flex-wrap gap-1">
          {shard.features.map((feature, idx) => (
            <span 
              key={idx}
              className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Выбран индикатор */}
        {isSelected && (
          <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400 rounded-lg animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-slate-900 to-black flex flex-col overflow-hidden">
      {/* Фоновая анимация */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Заголовок */}
      <div className="relative z-10 text-center py-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          🌐 SELECT SERVER
        </h1>
        <p className="text-gray-400">
          Добро пожаловать, <span className="text-cyan-400">{username}</span>! Выберите сервер для игры.
        </p>
      </div>

      {/* Фильтры */}
      <div className="relative z-10 flex justify-center gap-2 mb-4">
        {(['all', 'available', 'pvp', 'hardcore'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); playSound('click'); }}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filter === f 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }
            `}
          >
            {f === 'all' && 'Все серверы'}
            {f === 'available' && '🟢 Доступные'}
            {f === 'pvp' && '⚔️ PvP'}
            {f === 'hardcore' && '💀 Хардкор'}
          </button>
        ))}
      </div>

      {/* Список шардов */}
      <div className="relative z-10 flex-1 overflow-auto px-8 pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShards.map(renderShardCard)}
        </div>

        {filteredShards.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            Нет серверов по выбранному фильтру
          </div>
        )}
      </div>

      {/* Нижняя панель */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-gray-900/95 to-transparent py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Информация о выбранном шарде */}
          <div className="flex-1">
            {selectedShard && (() => {
              const shard = shards.find(s => s.id === selectedShard);
              if (!shard) return null;
              return (
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{shardService.getRegionEmoji(shard.region)}</span>
                  <div>
                    <div className="text-lg font-bold text-white">{shard.name}</div>
                    <div className="text-sm text-gray-400">
                      {shard.region} • {shard.ping}ms • {shard.population} игроков
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Кнопка подключения */}
          <button
            onClick={handleConnect}
            disabled={!selectedShard || isConnecting}
            className={`
              px-8 py-3 rounded-lg font-bold text-lg transition-all
              ${selectedShard && !isConnecting
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Подключение...
              </span>
            ) : (
              '🚀 Подключиться'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
