import { Pool } from 'pg';

export class DarkHubService {
  constructor(private pool: Pool) {}

  async listItems() {
    const res = await this.pool.query('SELECT * FROM darkhub_items ORDER BY id');
    return res.rows;
  }

  async buy(userId: string, itemId: number) {
    // Simulate TOR-like delay and risk; risk logged should be handled by Security layer
    const itemRes = await this.pool.query('SELECT price, commission_rate, stock, risk_level FROM darkhub_items WHERE id=$1', [itemId]);
    if (itemRes.rowCount === 0) throw new Error('Item not found');
    const { price, commission_rate, stock, risk_level } = itemRes.rows[0];
    if (stock <= 0) throw new Error('Out of stock');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE darkhub_items SET stock = stock - 1 WHERE id=$1', [itemId]);
      const commission = (Number(commission_rate) / 100) * Number(price);
      await client.query(
        'INSERT INTO market_transactions(order_id,user_id,item_id,quantity,total_price,commission) VALUES($1,$2,$3,$4,$5,$6)',
        [null, userId, itemId, 1, price, commission]
      );
      await client.query('COMMIT');
      return { total: price, commission, risk: risk_level };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
