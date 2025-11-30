import { Pool } from 'pg';

export class MarketService {
  constructor(private pool: Pool) {}

  async listItems(category?: string) {
    const query = category ?
      { text: 'SELECT * FROM market_items WHERE category=$1 ORDER BY id', values: [category] } :
      { text: 'SELECT * FROM market_items ORDER BY id', values: [] };
    const res = await this.pool.query(query);
    return res.rows;
  }

  async sell(userId: string, itemId: number, quantity: number, unitPrice: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const orderRes = await client.query(
        'INSERT INTO market_orders(user_id,item_id,type,quantity,unit_price,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
        [userId, itemId, 'sell', quantity, unitPrice, 'completed']
      );
      const orderId = orderRes.rows[0].id;
      await client.query('UPDATE market_items SET stock = stock + $1 WHERE id=$2', [quantity, itemId]);
      const total = unitPrice * quantity;
      const commission = total * 0.05; // 5% комиссия
      await client.query(
        'INSERT INTO market_transactions(order_id,user_id,item_id,quantity,total_price,commission) VALUES($1,$2,$3,$4,$5,$6)',
        [orderId, userId, itemId, quantity, total, commission]
      );
      await client.query('COMMIT');
      return { orderId, total, commission };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async buy(userId: string, itemId: number, quantity: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const itemRes = await client.query('SELECT base_price, stock FROM market_items WHERE id=$1', [itemId]);
      if (itemRes.rowCount === 0) throw new Error('Item not found');
      const { base_price, stock } = itemRes.rows[0];
      if (stock < quantity) throw new Error('Not enough stock');

      const orderRes = await client.query(
        'INSERT INTO market_orders(user_id,item_id,type,quantity,unit_price,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
        [userId, itemId, 'buy', quantity, base_price, 'completed']
      );
      const orderId = orderRes.rows[0].id;

      await client.query('UPDATE market_items SET stock = stock - $1 WHERE id=$2', [quantity, itemId]);
      const total = base_price * quantity;
      const commission = total * 0.02; // 2% комиссия
      await client.query(
        'INSERT INTO market_transactions(order_id,user_id,item_id,quantity,total_price,commission) VALUES($1,$2,$3,$4,$5,$6)',
        [orderId, userId, itemId, quantity, total, commission]
      );
      await client.query('COMMIT');
      return { orderId, total, commission };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
