import { Pool } from 'pg';
import { getDb } from '../db';

export interface SecurityEventRow {
  id: number;
  event_id: string;
  type: string;
  severity: string;
  status: string;
  timestamp: number;
  source_id?: string;
  source_name?: string;
  target_path?: string;
  description: string;
  blocked: boolean;
  damage_dealt: number;
  honeypot_id?: string;
  created_at: string;
}

export interface IntrusionRow {
  id: number;
  title: string;
  attacker_id?: string;
  attacker_name?: string;
  severity: string;
  started_at: number;
  resolved_at?: number;
  status: string;
  notes?: string;
  created_at: string;
}

export class SecurityService {
  private pool: Pool;
  constructor() {
    this.pool = getDb();
  }

  async logSecurityEvent(event: Omit<SecurityEventRow, 'id' | 'created_at'>): Promise<SecurityEventRow> {
    const q = `INSERT INTO security_events (
      event_id, type, severity, status, timestamp,
      source_id, source_name, target_path, description, blocked, damage_dealt, honeypot_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (event_id) DO UPDATE SET status = EXCLUDED.status
    RETURNING *`;
    const { rows } = await this.pool.query(q, [
      event.event_id, event.type, event.severity, event.status, event.timestamp,
      event.source_id || null, event.source_name || null, event.target_path || null,
      event.description, event.blocked, event.damage_dealt || 0, event.honeypot_id || null
    ]);
    return rows[0];
  }

  async listSecurityEvents(limit = 50): Promise<SecurityEventRow[]> {
    const { rows } = await this.pool.query('SELECT * FROM security_events ORDER BY timestamp DESC LIMIT $1', [limit]);
    return rows;
  }

  async createIntrusion(payload: Omit<IntrusionRow, 'id' | 'created_at' | 'status'> & { status?: string }): Promise<IntrusionRow> {
    const q = `INSERT INTO intrusions (title, attacker_id, attacker_name, severity, started_at, resolved_at, status, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const { rows } = await this.pool.query(q, [
      payload.title,
      payload.attacker_id || null,
      payload.attacker_name || null,
      payload.severity,
      payload.started_at,
      payload.resolved_at || null,
      payload.status || 'active',
      payload.notes || null
    ]);
    return rows[0];
  }

  async updateIntrusionStatus(id: number, status: string, resolvedAt?: number): Promise<IntrusionRow> {
    const q = `UPDATE intrusions SET status=$1, resolved_at=$2 WHERE id=$3 RETURNING *`;
    const { rows } = await this.pool.query(q, [status, resolvedAt || null, id]);
    return rows[0];
  }
}

export const securityService = new SecurityService();
export default securityService;
