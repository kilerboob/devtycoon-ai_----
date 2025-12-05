import { Server } from 'socket.io';
import { createServer } from 'http';

interface RaidEvent {
  raidId: number;
  playerId: number;
  username: string;
  action: string;
  data?: any;
  timestamp: number;
}

interface RaidRoom {
  raidId: number;
  participants: Map<number, any>;
  events: RaidEvent[];
}

const raidRooms = new Map<number, RaidRoom>();

export function setupRaidWebSocket(httpServer: createServer.Server) {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Join raid
    socket.on('raid:join', (data: { raidId: number; playerId: number; username: string }) => {
      const { raidId, playerId, username } = data;
      const room = `raid:${raidId}`;

      socket.join(room);

      if (!raidRooms.has(raidId)) {
        raidRooms.set(raidId, {
          raidId,
          participants: new Map(),
          events: []
        });
      }

      const raidRoom = raidRooms.get(raidId)!;
      raidRoom.participants.set(playerId, { playerId, username, socketId: socket.id });

      // Broadcast participant joined
      io.to(room).emit('raid:participant-joined', {
        playerId,
        username,
        participantCount: raidRoom.participants.size
      });

      console.log(`[WS] Player ${username} joined raid ${raidId}`);
    });

    // Hack attempt broadcast
    socket.on('raid:hack-attempt', (data: { raidId: number; playerId: number; success: boolean; progress: number }) => {
      const { raidId, playerId, success, progress } = data;
      const room = `raid:${raidId}`;

      const event: RaidEvent = {
        raidId,
        playerId,
        username: '',
        action: success ? 'hack:success' : 'hack:failure',
        data: { progress },
        timestamp: Date.now()
      };

      const raidRoom = raidRooms.get(raidId);
      if (raidRoom) {
        const participant = raidRoom.participants.get(playerId);
        if (participant) {
          event.username = participant.username;
          raidRoom.events.push(event);
        }
      }

      io.to(room).emit('raid:hack-attempt', {
        playerId,
        username: event.username,
        success,
        progress
      });

      console.log(`[WS] Player ${playerId} attempted hack in raid ${raidId}: ${success ? 'SUCCESS' : 'FAILURE'}`);
    });

    // Raid progress update
    socket.on('raid:progress', (data: { raidId: number; hackProgress: number; phase: string }) => {
      const { raidId, hackProgress, phase } = data;
      const room = `raid:${raidId}`;

      io.to(room).emit('raid:progress-update', {
        hackProgress,
        phase,
        timestamp: Date.now()
      });

      console.log(`[WS] Raid ${raidId} progress: ${hackProgress}% (${phase})`);
    });

    // Damage dealt
    socket.on('raid:damage', (data: { raidId: number; playerId: number; damage: number; target: string }) => {
      const { raidId, playerId, damage, target } = data;
      const room = `raid:${raidId}`;

      io.to(room).emit('raid:damage', {
        playerId,
        damage,
        target,
        timestamp: Date.now()
      });

      console.log(`[WS] Player ${playerId} dealt ${damage} damage to ${target}`);
    });

    // Loot drop
    socket.on('raid:loot-drop', (data: { raidId: number; itemId: string; rarity: string; value: number }) => {
      const { raidId, itemId, rarity, value } = data;
      const room = `raid:${raidId}`;

      io.to(room).emit('raid:loot-drop', {
        itemId,
        rarity,
        value,
        timestamp: Date.now()
      });

      console.log(`[WS] Raid ${raidId} loot drop: ${itemId} (${rarity})`);
    });

    // Raid completed
    socket.on('raid:complete', (data: { raidId: number; success: boolean; rewards: any }) => {
      const { raidId, success, rewards } = data;
      const room = `raid:${raidId}`;

      io.to(room).emit('raid:completed', {
        success,
        rewards,
        timestamp: Date.now()
      });

      // Clean up raid room
      setTimeout(() => {
        socket.leave(room);
        if (raidRooms.has(raidId)) {
          raidRooms.delete(raidId);
        }
      }, 5000);

      console.log(`[WS] Raid ${raidId} completed (success: ${success})`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);

      // Clean up participant from all raids
      raidRooms.forEach((raidRoom, raidId) => {
        raidRoom.participants.forEach((participant, playerId) => {
          if (participant.socketId === socket.id) {
            raidRoom.participants.delete(playerId);
            socket.broadcast.emit('raid:participant-left', {
              raidId,
              playerId,
              participantCount: raidRoom.participants.size
            });
          }
        });
      });
    });
  });

  return io;
}
