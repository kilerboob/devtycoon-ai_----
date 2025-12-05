import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/sound';
import { useRaidWebSocket } from '../hooks/useRaidWebSocket';
import { DataCenter3D } from './DataCenter3D';

interface ServerRoom {
  id: number;
  name: string;
  description: string;
  room_type: string;
  difficulty: string;
  security_level: number;
  ai_defense_strength: number;
  base_reward_currency: number;
  base_reward_xp: number;
  controlled_by_faction?: string;
}

interface Raid {
  id: number;
  server_room_id: number;
  raid_type: string;
  status: string;
  leader_id: number;
  hack_progress_percent: number;
  participants: any[];
  total_rewards_pool: any;
}

interface HackingGameState {
  active: boolean;
  difficulty: number;
  progress: number;
  timeRemaining: number;
  attempts: number;
  successCount: number;
  failureCount: number;
  currentChallenge: string;
}

interface RaidParticipant {
  playerId: string;
  username: string;
  joined: boolean;
}

export default function ServerRoomsApp() {
  const [serverRooms, setServerRooms] = useState<ServerRoom[]>([]);
  const [activeRaids, setActiveRaids] = useState<Raid[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ServerRoom | null>(null);
  const [userRaid, setUserRaid] = useState<Raid | null>(null);
  const [hackingGame, setHackingGame] = useState<HackingGameState | null>(null);
  const [selectedRaidType, setSelectedRaidType] = useState<'solo' | 'group'>('solo');
  const [raidParticipants, setRaidParticipants] = useState<RaidParticipant[]>([]);
  const [viewMode, setViewMode] = useState<'ui' | '3d'>('ui');
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Get player info (mock for now)
  const playerId = localStorage.getItem('playerId') || 'player-1';
  const username = localStorage.getItem('playerName') || 'Player';

  // Initialize WebSocket for raids
  const { joinRaid, emitHackAttempt, emitProgress, emitRaidComplete, onRaidEvent } = useRaidWebSocket({
    playerId,
    username
  });

  // Listen to raid events
  useEffect(() => {
    onRaidEvent((event) => {
      console.log('[Raid Event]', event.type, event.payload);

      switch (event.type) {
        case 'RAID_PARTICIPANT_JOINED':
          setRaidParticipants(prev => {
            const exists = prev.find(p => p.playerId === event.payload.playerId);
            if (!exists) {
              return [...prev, {
                playerId: event.payload.playerId,
                username: event.payload.username,
                joined: true
              }];
            }
            return prev;
          });
          break;

        case 'RAID_HACK_ATTEMPT':
          if (event.payload.success) {
            playSound('success');
            setHackingGame(prev => prev ? {
              ...prev,
              progress: event.payload.progress,
              successCount: prev.successCount + 1
            } : null);
          } else {
            playSound('error');
            setHackingGame(prev => prev ? {
              ...prev,
              attempts: prev.attempts - 1,
              failureCount: prev.failureCount + 1
            } : null);
          }
          break;

        case 'RAID_PROGRESS_UPDATE':
          setHackingGame(prev => prev ? {
            ...prev,
            progress: event.payload.hackProgress,
            phase: event.payload.phase
          } : null);
          break;

        case 'RAID_DAMAGE':
          console.log(`[Damage] ${event.payload.damage} to ${event.payload.target}`);
          break;

        case 'RAID_LOOT_DROP':
          playSound('success');
          console.log(`[Loot] ${event.payload.itemId} (${event.payload.rarity})`);
          break;

        case 'RAID_COMPLETED':
          handleRaidCompleted(event.payload);
          break;
      }
    });
  }, [onRaidEvent]);

  // Загрузить серверные комнаты
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/server-rooms');
        if (response.ok) {
          const data = await response.json();
          setServerRooms(data);
          if (data.length > 0 && !selectedRoom) {
            setSelectedRoom(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch server rooms:', error);
      }
    };

    const fetchActiveRaids = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/raids/active');
        if (response.ok) {
          const data = await response.json();
          setActiveRaids(data);
        }
      } catch (error) {
        console.error('Failed to fetch raids:', error);
      }
    };

    fetchRooms();
    const raidInterval = setInterval(fetchActiveRaids, 5000);
    return () => clearInterval(raidInterval);
  }, []);

  // Начать рейд
  const handleStartRaid = async () => {
    if (!selectedRoom) return;

    try {
      const response = await fetch('http://localhost:3000/api/raids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_room_id: selectedRoom.id,
          raid_type: selectedRaidType,
          player_id: playerId,
          username: username
        })
      });

      if (response.ok) {
        const raid = await response.json();
        setUserRaid(raid);
        
        // Join raid via WebSocket
        joinRaid(raid.id);
        setRaidParticipants([{
          playerId,
          username,
          joined: true
        }]);

        // Начать мини-игру взлома
        startHackingGame(selectedRoom.difficulty, raid.id);
        playSound?.('success');
      }
    } catch (error) {
      console.error('Failed to start raid:', error);
    }
  };

  // Запустить мини-игру взлома
  const startHackingGame = (difficulty: string, raidId: number) => {
    const difficultyMap = { easy: 1, normal: 2, hard: 3, legendary: 5 };
    const level = difficultyMap[difficulty as keyof typeof difficultyMap] || 1;

    const gameState: HackingGameState = {
      active: true,
      difficulty: level,
      progress: 0,
      timeRemaining: 30 + level * 10,
      attempts: 3,
      successCount: 0,
      failureCount: 0,
      currentChallenge: generateChallenge()
    };

    setHackingGame(gameState);
    
    // Emit progress to WebSocket
    emitProgress(raidId, 0, 'HACKING_STARTED');
  };

  // Генерировать одну задачу
  const generateChallenge = (): string => {
    const challenges = [
      `Decrypt: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      `Solve: 2^${Math.floor(Math.random() * 10)} = ?`,
      `Crack: Port ${Math.floor(Math.random() * 65536)}`,
      `Bypass: Security Level ${Math.floor(Math.random() * 10)}`
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Обработать правильный ответ
  const handleHackSuccess = async () => {
    if (!hackingGame || !userRaid) return;

    const newProgress = Math.min(hackingGame.progress + 20, 100);
    const updated = {
      ...hackingGame,
      progress: newProgress,
      successCount: hackingGame.successCount + 1,
      currentChallenge: newProgress < 100 ? generateChallenge() : ''
    };

    // Emit hack attempt to WebSocket
    emitHackAttempt(userRaid.id, true, newProgress);

    if (newProgress === 100) {
      // Взлом завершён
      completeRaid(true);
    } else {
      setHackingGame(updated);
    }

    playSound?.('success');
  };

  // Обработить ошибку
  const handleHackFailure = () => {
    if (!hackingGame) return;

    const newAttempts = hackingGame.attempts - 1;
    if (newAttempts <= 0) {
      completeRaid(false);
    } else {
      const updated = {
        ...hackingGame,
        attempts: newAttempts,
        failureCount: hackingGame.failureCount + 1,
        currentChallenge: generateChallenge()
      };
      setHackingGame(updated);
      playSound?.('error');
    }
  };

  // Handle raid completion from WebSocket
  const handleRaidCompleted = (payload: any) => {
    console.log('[Raid Completed]', payload);
    // Reset state after raid completion broadcast
    setTimeout(() => {
      setHackingGame(null);
      setUserRaid(null);
      setRaidParticipants([]);
    }, 2000);
  };

  // Завершить рейд
  const completeRaid = async (success: boolean) => {
    if (!userRaid || !selectedRoom) return;

    try {
      const totalRewards = success
        ? {
            credits: selectedRoom.base_reward_currency * (1 + hackingGame!.difficulty * 0.5),
            xp: selectedRoom.base_reward_xp * (1 + hackingGame!.difficulty * 0.5)
          }
        : { credits: 0, xp: 0 };

      // Emit raid completion via WebSocket
      emitRaidComplete(userRaid.id, success, totalRewards);

      const response = await fetch(`http://localhost:3000/api/raids/${userRaid.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success, total_rewards: totalRewards })
      });

      if (response.ok) {
        playSound?.(success ? 'success' : 'error');
      }
    } catch (error) {
      console.error('Failed to complete raid:', error);
    }
  };

  // Таймер для мини-игры
  useEffect(() => {
    if (!hackingGame || !hackingGame.active) return;

    gameLoopRef.current = setInterval(() => {
      setHackingGame((prev) => {
        if (!prev) return null;
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          completeRaid(false);
          return null;
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [hackingGame?.active]);

  // UI для мини-игры взлома
  if (hackingGame) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
        <div className="w-full max-w-2xl h-full max-h-screen bg-slate-900 border border-cyan-500 rounded-lg overflow-hidden flex flex-col">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 text-white">
            <h1 className="text-2xl font-bold">🔐 HACKING MINIGAME</h1>
            <p className="text-sm text-cyan-200">Difficulty: Level {hackingGame.difficulty}</p>
          </div>

          {/* Основной контент */}
          <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-6">
            {/* Прогресс взлома */}
            <div className="w-full">
              <div className="flex justify-between mb-2">
                <span className="text-cyan-400 font-bold">Hack Progress</span>
                <span className="text-cyan-300">{hackingGame.progress}%</span>
              </div>
              <div className="w-full h-8 bg-slate-700 rounded border border-cyan-500 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-300"
                  style={{ width: `${hackingGame.progress}%` }}
                />
              </div>
            </div>

            {/* Задача */}
            <div className="bg-slate-800 border border-cyan-500 rounded p-6 w-full text-center">
              <div className="text-cyan-300 text-lg font-mono mb-4">{hackingGame.currentChallenge}</div>
              <div className="text-sm text-slate-400">Attempts remaining: {hackingGame.attempts}</div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={handleHackSuccess}
                disabled={hackingGame.attempts <= 0}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded font-bold text-white"
              >
                ✓ CORRECT
              </button>
              <button
                onClick={handleHackFailure}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-bold text-white"
              >
                ✗ WRONG
              </button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-slate-800 border border-cyan-500 rounded p-4 text-center">
                <div className="text-cyan-400 font-bold text-2xl">{hackingGame.successCount}</div>
                <div className="text-slate-400 text-sm">Successes</div>
              </div>
              <div className="bg-slate-800 border border-cyan-500 rounded p-4 text-center">
                <div className="text-red-400 font-bold text-2xl">{hackingGame.failureCount}</div>
                <div className="text-slate-400 text-sm">Failures</div>
              </div>
              <div className="bg-slate-800 border border-cyan-500 rounded p-4 text-center">
                <div className="text-yellow-400 font-bold text-2xl">{hackingGame.timeRemaining}s</div>
                <div className="text-slate-400 text-sm">Time Left</div>
              </div>
            </div>
          </div>

          {/* Строка состояния */}
          <div className="bg-slate-800 border-t border-cyan-500 p-4 text-center text-cyan-400">
            Status: <span className="text-yellow-300 font-bold">HACKING IN PROGRESS</span>
          </div>
        </div>
      </div>
    );
  }

  // Основной UI для списка серверов
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black text-white overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Заголовок */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">🌐 SERVER ROOMS</h1>
            <p className="text-slate-300">Choose a server to raid and hack</p>
          </div>
          {/* Tab Switcher */}
          <div className="flex gap-2 bg-slate-800 border border-cyan-500 rounded-lg p-2">
            <button
              onClick={() => setViewMode('ui')}
              className={`px-4 py-2 rounded font-bold transition ${
                viewMode === 'ui'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📋 UI View
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 rounded font-bold transition ${
                viewMode === '3d'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🏗️ 3D View
            </button>
          </div>
        </div>

        {/* 3D View */}
        {viewMode === '3d' && selectedRoom && (
          <div className="bg-slate-800 border border-cyan-500 rounded-lg overflow-hidden h-96 sm:h-screen sm:fixed sm:inset-0 sm:m-0 sm:rounded-none">
            <div className="w-full h-full">
              {(() => {
                const healthValue = userRaid && hackingGame ? Math.max(0, 100 - (hackingGame as any).progress) : 100;
                const progressValue = hackingGame ? (hackingGame as any).progress : 0;
                return (
                  <DataCenter3D
                    serverId={selectedRoom.id}
                    serverName={selectedRoom.name}
                    difficulty={selectedRoom.difficulty}
                    securityLevel={selectedRoom.security_level}
                    currentHealth={healthValue}
                    maxHealth={100}
                    raidActive={!!userRaid}
                    hackProgress={progressValue}
                  />
                );
              })()}
            </div>
            {/* Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 border border-cyan-500 rounded-lg p-4 text-white max-w-xs">
              <h3 className="text-cyan-400 font-bold mb-2">{selectedRoom.name}</h3>
              <div className="text-sm space-y-1 text-slate-300">
                <p>🛡️ Security: {selectedRoom.security_level}/5</p>
                <p>⚔️ Defense: {selectedRoom.ai_defense_strength}%</p>
                <p>💰 Reward: ${selectedRoom.base_reward_currency}</p>
                {userRaid && hackingGame && (
                  <p>🔓 Hack Progress: {(hackingGame as any).progress}%</p>
                )}
              </div>
              <button
                onClick={() => setViewMode('ui')}
                className="mt-3 w-full px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-bold transition"
              >
                ← Back to UI
              </button>
            </div>
          </div>
        ) : (
          /* UI View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Список серверов */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800 border border-cyan-500 rounded-lg p-4">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">🖥️ Servers</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {serverRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-3 rounded text-left transition ${
                      selectedRoom?.id === room.id
                        ? 'bg-cyan-600 border border-cyan-400'
                        : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-bold text-sm">{room.name}</div>
                    <div className="text-xs text-slate-300">{room.difficulty.toUpperCase()}</div>
                    <div className="text-xs text-cyan-300">Reward: ${room.base_reward_currency}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Активные рейды */}
            <div className="bg-slate-800 border border-cyan-500 rounded-lg p-4">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">⚔️ Active Raids ({activeRaids.length})</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                {activeRaids.slice(0, 5).map((raid) => (
                  <div key={raid.id} className="bg-slate-700 p-2 rounded">
                    <div className="font-bold text-cyan-300">Raid #{raid.id}</div>
                    <div className="text-slate-400">Players: {raid.participants?.length || 0}</div>
                    <div className="text-green-400">Progress: {raid.hack_progress_percent}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка - Детали сервера */}
          {selectedRoom && (
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-cyan-500 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-cyan-400 mb-2">{selectedRoom.name}</h2>
                  <p className="text-slate-300">{selectedRoom.description}</p>
                </div>

                {/* Параметры сервера */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700 p-4 rounded border border-slate-600">
                    <div className="text-slate-400 text-sm">Type</div>
                    <div className="text-white font-bold text-lg capitalize">{selectedRoom.room_type}</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded border border-slate-600">
                    <div className="text-slate-400 text-sm">Difficulty</div>
                    <div className="text-white font-bold text-lg capitalize">{selectedRoom.difficulty}</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded border border-slate-600">
                    <div className="text-slate-400 text-sm">Security Level</div>
                    <div className="text-yellow-400 font-bold text-lg">{selectedRoom.security_level}/5</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded border border-slate-600">
                    <div className="text-slate-400 text-sm">AI Defense</div>
                    <div className="text-red-400 font-bold text-lg">{selectedRoom.ai_defense_strength}%</div>
                  </div>
                </div>

                {/* Награды */}
                <div className="bg-slate-700 p-4 rounded border border-green-600 mb-6">
                  <h3 className="text-green-400 font-bold mb-3">Rewards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-400 text-sm">Credits</div>
                      <div className="text-green-400 font-bold text-lg">${selectedRoom.base_reward_currency}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Experience</div>
                      <div className="text-blue-400 font-bold text-lg">{selectedRoom.base_reward_xp} XP</div>
                    </div>
                  </div>
                </div>

                {/* Выбор типа рейда */}
                <div className="mb-6">
                  <h3 className="text-cyan-400 font-bold mb-3">Raid Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedRaidType('solo')}
                      className={`p-3 rounded font-bold transition ${
                        selectedRaidType === 'solo'
                          ? 'bg-cyan-600 border border-cyan-400'
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      👤 Solo
                    </button>
                    <button
                      onClick={() => setSelectedRaidType('group')}
                      className={`p-3 rounded font-bold transition ${
                        selectedRaidType === 'group'
                          ? 'bg-cyan-600 border border-cyan-400'
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      👥 Group
                    </button>
                  </div>
                </div>

                {/* Кнопка начать рейд */}
                <button
                  onClick={handleStartRaid}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-lg font-bold text-lg transition"
                >
                  🚀 START RAID
                </button>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
