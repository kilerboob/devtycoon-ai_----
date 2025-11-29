import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'devtycoon_angverse',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const getDb = () => pool;

/**
 * Execute a query on a specific node shard.
 * It sets the search_path to the node's schema first.
 */
export const queryShard = async (nodeId: string, text: string, params?: any[]): Promise<QueryResult> => {
    const client = await pool.connect();
    try {
        // Sanitize nodeId to prevent SQL injection in search_path
        // Only allow alphanumeric and underscores
        if (!/^[a-zA-Z0-9_]+$/.test(nodeId)) {
            throw new Error('Invalid Node ID');
        }

        await client.query(`SET search_path TO ${nodeId}, global_data, public`);
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
};

/**
 * Execute a query on the global schema.
 */
export const queryGlobal = async (text: string, params?: any[]): Promise<QueryResult> => {
    const client = await pool.connect();
    try {
        await client.query('SET search_path TO global_data, public');
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
};

export const getClient = async (): Promise<PoolClient> => {
    return await pool.connect();
};
