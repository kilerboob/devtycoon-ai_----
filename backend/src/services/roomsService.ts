import { Pool } from 'pg';
import { getDb } from '../db';

export interface Room {
  id: number;
  owner_id: string;
  name: string;
  theme: string;
  layout: any;
  privacy: 'public' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
}

export interface RoomItem {
  id: number;
  room_id: number;
  item_type: string;
  asset_id?: string;
  position: any;
  rotation: any;
  scale: any;
  properties: any;
  created_at: string;
  updated_at: string;
}

export interface UserPcComponent {
  id: number;
  user_id: string;
  room_id?: number | null;
  component_type: string;
  model: string;
  tier: number;
  stats: any;
  installed_at: string;
  updated_at: string;
}

export class RoomsService {
  private pool: Pool;

  constructor() {
    this.pool = getDb();
  }

  async listAllRooms(): Promise<Room[]> {
    const { rows } = await this.pool.query('SELECT * FROM rooms ORDER BY updated_at DESC');
    return rows;
  }

  async listRooms(ownerId: string): Promise<Room[]> {
    const { rows } = await this.pool.query('SELECT * FROM rooms WHERE owner_id = $1 ORDER BY updated_at DESC', [ownerId]);
    return rows;
  }

  async getRoom(roomId: number): Promise<Room | null> {
    const { rows } = await this.pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    return rows[0] || null;
  }

  async createRoom(ownerId: string, name: string, theme: string = 'default'): Promise<Room> {
    const { rows } = await this.pool.query(
      'INSERT INTO rooms(owner_id, name, theme) VALUES($1, $2, $3) RETURNING *',
      [ownerId, name, theme]
    );
    return rows[0];
  }

  async updateRoom(roomId: number, patch: Partial<Room>): Promise<Room | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${idx++}`);
      values.push(v);
    }
    if (fields.length === 0) return this.getRoom(roomId);
    values.push(roomId);
    const { rows } = await this.pool.query(
      `UPDATE rooms SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`
      , values
    );
    return rows[0] || null;
  }

  async deleteRoom(roomId: number): Promise<void> {
    await this.pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);
  }

  async listPublicRooms(limit: number = 20): Promise<Room[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM rooms WHERE privacy = $1 ORDER BY updated_at DESC LIMIT $2',
      ['public', limit]
    );
    return rows;
  }

  async listItems(roomId: number): Promise<RoomItem[]> {
    const { rows } = await this.pool.query('SELECT * FROM room_items WHERE room_id = $1 ORDER BY id', [roomId]);
    return rows;
  }

  async upsertItem(roomId: number, item: Partial<RoomItem>): Promise<RoomItem> {
    const { rows } = await this.pool.query(
      `INSERT INTO room_items (room_id, item_type, asset_id, position, rotation, scale, properties)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [roomId, item.item_type, item.asset_id || null, item.position || { x:0,y:0,z:0 }, item.rotation || { x:0,y:0,z:0 }, item.scale || { x:1,y:1,z:1 }, item.properties || {}]
    );
    if (rows[0]) return rows[0];
    // Fallback: update existing by type
    const { rows: updated } = await this.pool.query(
      `UPDATE room_items SET asset_id = COALESCE($3, asset_id), position = $4, rotation = $5, scale = $6, properties = $7
       WHERE room_id = $1 AND item_type = $2
       RETURNING *`,
      [roomId, item.item_type, item.asset_id || null, item.position || { x:0,y:0,z:0 }, item.rotation || { x:0,y:0,z:0 }, item.scale || { x:1,y:1,z:1 }, item.properties || {}]
    );
    return updated[0];
  }

  async removeItem(itemId: number): Promise<void> {
    await this.pool.query('DELETE FROM room_items WHERE id = $1', [itemId]);
  }

  async listPcComponents(userId: string): Promise<UserPcComponent[]> {
    const { rows } = await this.pool.query('SELECT * FROM user_pc_components WHERE user_id = $1 ORDER BY component_type', [userId]);
    return rows;
  }

  async upgradePcComponent(userId: string, componentType: string, model: string, stats: any, roomId?: number): Promise<UserPcComponent> {
    const { rows } = await this.pool.query(
      `INSERT INTO user_pc_components(user_id, room_id, component_type, model, tier, stats)
       VALUES($1,$2,$3,$4,1,$5)
       ON CONFLICT (user_id, component_type)
       DO UPDATE SET model = EXCLUDED.model, tier = user_pc_components.tier + 1, stats = EXCLUDED.stats, room_id = EXCLUDED.room_id, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, roomId ?? null, componentType, model, stats]
    );
    return rows[0];
  }
}

export const roomsService = new RoomsService();

/**
 * Calculate PC performance stats from components
 */
export function calculatePCPerformance(components: UserPcComponent[]): {
  autoCodePerSecond: number;
  clickPower: number;
  temperature: number;
  cooling: number;
} {
  let totalPower = 0;
  let heatGen = 0;
  let cooling = 0;

  for (const comp of components) {
    const stats = comp.stats || {};
    const tier = comp.tier || 1;

    switch (comp.component_type) {
      case 'cpu':
        totalPower += (stats.cores || 4) * (stats.clockSpeed || 3.0) * 0.5 * tier;
        heatGen += (stats.cores || 4) * 2;
        break;
      case 'gpu':
        totalPower += (stats.vram || 8) * 10 * tier;
        heatGen += (stats.tdp || 200) / 10;
        break;
      case 'ram':
        totalPower += (stats.capacity || 16) * 0.5 * tier;
        break;
      case 'storage':
        totalPower += (stats.speed || 500) * 0.01 * tier;
        break;
      case 'cooler':
        cooling += (stats.cooling || 50) * tier;
        break;
    }
  }

  const autoCodePerSecond = Math.max(1, totalPower * 0.1);
  const clickPower = Math.max(1, totalPower * 0.05);
  const temperature = Math.max(30, Math.min(100, heatGen - cooling + 40));

  return {
    autoCodePerSecond,
    clickPower,
    temperature,
    cooling,
  };
}