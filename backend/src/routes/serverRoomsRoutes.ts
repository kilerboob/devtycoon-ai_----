import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

interface Raid {
  id: number;
  server_room_id: number;
  raid_type: string;
  status: string;
  leader_id: number;
  hack_progress_percent: number;
  started_at?: string;
  ended_at?: string;
  total_rewards_pool: any;
}

interface RaidParticipant {
  id: number;
  player_id: number;
  username: string;
  status: string;
  hacks_successful: number;
  damage_dealt: number;
}

// Получить все доступные серверные комнаты (локации)
router.get('/server-rooms', async (req: Request, res: Response) => {
  try {
    const { difficulty, room_type } = req.query;
    let query = 'SELECT * FROM server_rooms WHERE is_active = true';
    const params: any[] = [];

    if (difficulty) {
      query += ' AND difficulty = $' + (params.length + 1);
      params.push(difficulty);
    }
    if (room_type) {
      query += ' AND room_type = $' + (params.length + 1);
      params.push(room_type);
    }

    query += ' ORDER BY difficulty ASC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('[GET /server-rooms]', error);
    res.status(500).json({ error: 'Failed to fetch server rooms' });
  }
});

// Получить детали конкретного серверного помещения
router.get('/server-rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const result = await pool.query('SELECT * FROM server_rooms WHERE id = $1', [roomId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[GET /server-rooms/:roomId]', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Создать новый рейд (начать взлом)
router.post('/raids', async (req: Request, res: Response) => {
  try {
    const { server_room_id, raid_type, player_id, username } = req.body;

    if (!server_room_id || !raid_type || !player_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Начать рейд
    const raidResult = await pool.query(
      `INSERT INTO raids (server_room_id, raid_type, raid_mode, leader_id, status, phase, started_at)
       VALUES ($1, $2, 'hack', $3, 'pending', 'preparation', NOW())
       RETURNING *`,
      [server_room_id, raid_type, player_id]
    );

    const raid = raidResult.rows[0];

    // Добавить лидера как участника
    await pool.query(
      `INSERT INTO raid_participants (raid_id, player_id, username, status)
       VALUES ($1, $2, $3, 'active')`,
      [raid.id, player_id, username]
    );

    console.log(`[POST /raids] Raid ${raid.id} created by player ${player_id}`);
    res.status(201).json(raid);
  } catch (error) {
    console.error('[POST /raids]', error);
    res.status(500).json({ error: 'Failed to create raid' });
  }
});

// Присоединиться к рейду
router.post('/raids/:raidId/join', async (req: Request, res: Response) => {
  try {
    const { raidId } = req.params;
    const { player_id, username } = req.body;

    if (!player_id) return res.status(400).json({ error: 'player_id required' });

    // Проверить, не уже ли участвует
    const existing = await pool.query(
      'SELECT * FROM raid_participants WHERE raid_id = $1 AND player_id = $2',
      [raidId, player_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already a participant' });
    }

    // Добавить участника
    await pool.query(
      `INSERT INTO raid_participants (raid_id, player_id, username, status)
       VALUES ($1, $2, $3, 'active')`,
      [raidId, player_id, username]
    );

    console.log(`[POST /raids/:raidId/join] Player ${player_id} joined raid ${raidId}`);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[POST /raids/:raidId/join]', error);
    res.status(500).json({ error: 'Failed to join raid' });
  }
});

// Обновить прогресс взлома
router.patch('/raids/:raidId/progress', async (req: Request, res: Response) => {
  try {
    const { raidId } = req.params;
    const { hack_progress_percent, phase, status, hacks_successful, damage_dealt, player_id } = req.body;

    let updateQuery = 'UPDATE raids SET updated_at = NOW()';
    const params: any[] = [];

    if (hack_progress_percent !== undefined) {
      params.push(hack_progress_percent);
      updateQuery += `, hack_progress_percent = $${params.length}`;
    }
    if (phase !== undefined) {
      params.push(phase);
      updateQuery += `, phase = $${params.length}`;
    }
    if (status !== undefined) {
      params.push(status);
      updateQuery += `, status = $${params.length}`;
    }

    params.push(raidId);
    updateQuery += ` WHERE id = $${params.length} RETURNING *`;

    const raidResult = await pool.query(updateQuery, params);
    if (raidResult.rows.length === 0) return res.status(404).json({ error: 'Raid not found' });

    // Обновить статистику участника
    if (hacks_successful !== undefined || damage_dealt !== undefined) {
      let participantUpdate = 'UPDATE raid_participants SET updated_at = NOW()';
      const pParams: any[] = [];

      if (hacks_successful !== undefined) {
        pParams.push(hacks_successful);
        participantUpdate += `, hacks_successful = hacks_successful + $${pParams.length}`;
      }
      if (damage_dealt !== undefined) {
        pParams.push(damage_dealt);
        participantUpdate += `, damage_dealt = damage_dealt + $${pParams.length}`;
      }

      pParams.push(raidId);
      pParams.push(player_id);
      participantUpdate += ` WHERE raid_id = $${pParams.length - 1} AND player_id = $${pParams.length}`;

      await pool.query(participantUpdate, pParams);
    }

    console.log(`[PATCH /raids/:raidId/progress] Raid ${raidId} progress updated`);
    res.json(raidResult.rows[0]);
  } catch (error) {
    console.error('[PATCH /raids/:raidId/progress]', error);
    res.status(500).json({ error: 'Failed to update raid progress' });
  }
});

// Завершить рейд и распределить награды
router.post('/raids/:raidId/complete', async (req: Request, res: Response) => {
  try {
    const { raidId } = req.params;
    const { success, total_rewards } = req.body;

    // Обновить статус рейда
    const raidResult = await pool.query(
      `UPDATE raids 
       SET status = $1, ended_at = NOW(), total_rewards_pool = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [success ? 'completed' : 'failed', total_rewards || {}, raidId]
    );

    if (raidResult.rows.length === 0) return res.status(404).json({ error: 'Raid not found' });

    const raid = raidResult.rows[0];

    // Получить всех участников
    const participantsResult = await pool.query(
      'SELECT * FROM raid_participants WHERE raid_id = $1',
      [raidId]
    );

    const participants = participantsResult.rows;

    // Распределить награды
    for (const participant of participants) {
      const individualReward = {
        credits: Math.floor((total_rewards?.credits || 0) / participants.length),
        xp: Math.floor((total_rewards?.xp || 0) / participants.length)
      };

      await pool.query(
        `UPDATE raid_participants 
         SET individual_reward = $1, contribution_percent = $2
         WHERE id = $3`,
        [individualReward, 100 / participants.length, participant.id]
      );

      // Создать награду для каждого участника
      if (success) {
        await pool.query(
          `INSERT INTO raid_rewards (raid_id, player_id, reward_type, reward_value, reward_data, rarity)
           VALUES ($1, $2, 'currency', $3, $4, 'common'),
                  ($1, $2, 'xp', $5, $6, 'common')`,
          [
            raidId,
            participant.player_id,
            individualReward.credits,
            { currency: 'credits' },
            individualReward.xp,
            { currency: 'xp' }
          ]
        );
      }
    }

    console.log(`[POST /raids/:raidId/complete] Raid ${raidId} completed (success: ${success})`);
    res.json({ raid, participants, rewards_distributed: participants.length });
  } catch (error) {
    console.error('[POST /raids/:raidId/complete]', error);
    res.status(500).json({ error: 'Failed to complete raid' });
  }
});

// Получить список активных рейдов
router.get('/raids/active', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM raid_participants WHERE raid_id = r.id) as participant_count
       FROM raids r
       WHERE r.status IN ('pending', 'active', 'hacking')
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[GET /raids/active]', error);
    res.status(500).json({ error: 'Failed to fetch active raids' });
  }
});

// Получить рейд по ID с участниками
router.get('/raids/:raidId', async (req: Request, res: Response) => {
  try {
    const { raidId } = req.params;
    const raidResult = await pool.query('SELECT * FROM raids WHERE id = $1', [raidId]);
    if (raidResult.rows.length === 0) return res.status(404).json({ error: 'Raid not found' });

    const participantsResult = await pool.query(
      'SELECT * FROM raid_participants WHERE raid_id = $1 ORDER BY join_timestamp DESC',
      [raidId]
    );

    const rewardsResult = await pool.query(
      'SELECT * FROM raid_rewards WHERE raid_id = $1',
      [raidId]
    );

    res.json({
      ...raidResult.rows[0],
      participants: participantsResult.rows,
      rewards: rewardsResult.rows
    });
  } catch (error) {
    console.error('[GET /raids/:raidId]', error);
    res.status(500).json({ error: 'Failed to fetch raid' });
  }
});

// Получить награды игрока за рейды
router.get('/raids/rewards/:playerId', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const result = await pool.query(
      `SELECT * FROM raid_rewards 
       WHERE player_id = $1
       ORDER BY created_at DESC`,
      [playerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[GET /raids/rewards/:playerId]', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// Получить таблицу лидеров рейдов
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { season = 'current', sort = 'totalLoot' } = req.query;

    // Build leaderboard with aggregated stats
    const result = await pool.query(`
      WITH player_raid_stats AS (
        SELECT 
          rp.player_id,
          COUNT(DISTINCT r.id) as raids_completed,
          COUNT(CASE WHEN r.status = 'completed' THEN 1 END)::float / 
            NULLIF(COUNT(DISTINCT r.id), 0) as success_rate,
          COALESCE(SUM(rr.value), 0) as total_loot,
          MIN(r.duration_limit_seconds - EXTRACT(EPOCH FROM (r.started_at::timestamp - r.created_at::timestamp))::integer) as fastest_time,
          MAX(sr.difficulty) as highest_difficulty,
          MAX(r.updated_at) as last_raid_time,
          u.username as player_name,
          rp.player_id
        FROM raid_participants rp
        JOIN raids r ON rp.raid_id = r.id
        JOIN server_rooms sr ON r.server_room_id = sr.id
        LEFT JOIN raid_rewards rr ON rp.player_id = rr.player_id AND r.id = rr.raid_id
        LEFT JOIN users u ON rp.player_id::text = u.id::text
        WHERE r.status = 'completed'
        GROUP BY rp.player_id, u.username
      )
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_loot DESC) as rank,
        player_id,
        player_name,
        raids_completed,
        COALESCE(success_rate, 0) as success_rate,
        total_loot,
        COALESCE(fastest_time, 0) as fastest_time,
        COALESCE(highest_difficulty, 'easy') as highest_difficulty,
        COALESCE(EXTRACT(EPOCH FROM last_raid_time), 0) * 1000 as last_raid_time
      FROM player_raid_stats
      WHERE raids_completed > 0
      ORDER BY total_loot DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('[GET /leaderboard]', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
