import { Pool } from 'pg';
import { getDbPool } from '../db';

export interface SecurityGuildMemberRow {
  id: number;
  user_id: string;
  username: string;
  rank: string;
  joined_at: string;
  reputation: number;
}

export interface SecurityContractRow {
  id: number;
  contract_id: string;
  corporation_id: string;
  title: string;
  description?: string;
  status: string;
  reward_money: number;
  reward_rep: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export class SecurityGuildService {
  private pool: Pool;
  constructor() {
    this.pool = getDbPool();
  }

  async joinGuild(userId: string, username: string): Promise<SecurityGuildMemberRow> {
    const q = `INSERT INTO security_guild_members (user_id, username)
               VALUES ($1,$2)
               ON CONFLICT (user_id) DO UPDATE SET username=EXCLUDED.username
               RETURNING *`;
    const { rows } = await this.pool.query(q, [userId, username]);
    return rows[0];
  }

  async listContracts(status: string = 'open'): Promise<SecurityContractRow[]> {
    const { rows } = await this.pool.query('SELECT * FROM security_contracts WHERE status=$1 ORDER BY created_at DESC', [status]);
    return rows;
  }

  async createContract(contract: Omit<SecurityContractRow, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: string }): Promise<SecurityContractRow> {
    const q = `INSERT INTO security_contracts (contract_id, corporation_id, title, description, status, reward_money, reward_rep, assigned_to)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const { rows } = await this.pool.query(q, [
      contract.contract_id,
      contract.corporation_id,
      contract.title,
      contract.description || null,
      contract.status || 'open',
      contract.reward_money || 0,
      contract.reward_rep || 0,
      contract.assigned_to || null
    ]);
    return rows[0];
  }

  async assignContract(contractId: string, userId: string): Promise<SecurityContractRow> {
    const q = `UPDATE security_contracts SET status='assigned', assigned_to=$1, updated_at=NOW() WHERE contract_id=$2 RETURNING *`;
    const { rows } = await this.pool.query(q, [userId, contractId]);
    return rows[0];
  }

  async completeContract(contractId: string): Promise<SecurityContractRow> {
    const q = `UPDATE security_contracts SET status='completed', updated_at=NOW() WHERE contract_id=$1 RETURNING *`;
    const { rows } = await this.pool.query(q, [contractId]);
    return rows[0];
  }
}

export const securityGuildService = new SecurityGuildService();
export default securityGuildService;
