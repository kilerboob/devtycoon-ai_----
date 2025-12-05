import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RaidSocketOptions {
  playerId: string;
  username: string;
  serverUrl?: string;
}

export function useRaidWebSocket(options: RaidSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const { playerId, username, serverUrl = '' } = options;

  useEffect(() => {
    // Initialize socket connection
    const socket = io(serverUrl || window.location.origin, {
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Raid WS] Connected:', socket.id);
      
      // Authenticate
      socket.emit('auth', {
        playerId,
        playerName: username,
        shardId: 'default',
        token: localStorage.getItem('authToken')
      });
    });

    socket.on('auth:success', (data) => {
      console.log('[Raid WS] Auth success:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('[Raid WS] Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Raid WS] Disconnected:', reason);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [playerId, username, serverUrl]);

  const joinRaid = useCallback((raidId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('raid:join', {
        raidId,
        playerId,
        username
      });
      socketRef.current.on('sync:event', (event) => {
        if (event.type === 'RAID_PARTICIPANT_JOINED') {
          console.log('[Raid WS] Participant joined:', event.payload);
        }
      });
    }
  }, [playerId, username]);

  const emitHackAttempt = useCallback((raidId: number, success: boolean, progress: number) => {
    if (socketRef.current) {
      socketRef.current.emit('raid:hack-attempt', {
        raidId,
        playerId,
        success,
        progress
      });
    }
  }, [playerId]);

  const emitProgress = useCallback((raidId: number, hackProgress: number, phase: string) => {
    if (socketRef.current) {
      socketRef.current.emit('raid:progress', {
        raidId,
        hackProgress,
        phase
      });
    }
  }, []);

  const emitDamage = useCallback((raidId: number, damage: number, target: string) => {
    if (socketRef.current) {
      socketRef.current.emit('raid:damage', {
        raidId,
        playerId,
        damage,
        target
      });
    }
  }, [playerId]);

  const emitLootDrop = useCallback((raidId: number, itemId: string, rarity: string, value: number) => {
    if (socketRef.current) {
      socketRef.current.emit('raid:loot-drop', {
        raidId,
        itemId,
        rarity,
        value
      });
    }
  }, []);

  const emitRaidComplete = useCallback((raidId: number, success: boolean, rewards: any) => {
    if (socketRef.current) {
      socketRef.current.emit('raid:complete', {
        raidId,
        success,
        rewards
      });
    }
  }, []);

  const onRaidEvent = useCallback((handler: (event: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('sync:event', (event) => {
        if (event.type.startsWith('RAID_')) {
          handler(event);
        }
      });
    }
  }, []);

  return {
    socket: socketRef.current,
    joinRaid,
    emitHackAttempt,
    emitProgress,
    emitDamage,
    emitLootDrop,
    emitRaidComplete,
    onRaidEvent
  };
}
