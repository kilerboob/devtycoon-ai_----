import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodeRoutes from './routes/nodeRoutes';
import { getDb } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/nodes/:node_id', nodeRoutes);

// Health Check
app.get('/health', async (req, res) => {
    try {
        const pool = getDb();
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', db: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
