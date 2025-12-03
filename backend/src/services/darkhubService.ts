import { getDb } from '../db';

interface DarkHubItem {
    id: number;
    name: string;
    description: string;
    base_price: number;
    risk_level: number;
    commission_rate: number;
    stock: number;
    category: string;
}

export const darkhubService = {
    async listItems(): Promise<DarkHubItem[]> {
        const pool = getDb();
        const result = await pool.query(
            'SELECT * FROM darkhub_items WHERE stock > 0 ORDER BY risk_level DESC, name ASC'
        );
        return result.rows;
    },

    async buy(userId: string, itemId: number): Promise<{ success: boolean; total: number; commission: number; risk: number }> {
        const pool = getDb();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get item
            const itemRes = await client.query('SELECT * FROM darkhub_items WHERE id = $1', [itemId]);
            if (itemRes.rows.length === 0) {
                throw new Error('Item not found');
            }

            const item = itemRes.rows[0];
            if (item.stock <= 0) {
                throw new Error('Out of stock');
            }

            // Calculate total with commission
            const commission = Math.floor(item.base_price * item.commission_rate);
            const total = item.base_price + commission;

            // Update stock
            await client.query('UPDATE darkhub_items SET stock = stock - 1 WHERE id = $1', [itemId]);

            // Log transaction (optional: add darkhub_transactions table if needed)
            // For now, just return success

            await client.query('COMMIT');

            return {
                success: true,
                total,
                commission,
                risk: item.risk_level
            };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};
