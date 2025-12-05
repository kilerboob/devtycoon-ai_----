import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import nodeRoutes from './routes/nodeRoutes';
import securityRoutes from './routes/securityRoutes';
import securityGuildRoutes from './routes/securityGuildRoutes';
import marketRoutes from './routes/marketRoutes';
import darkhubRoutes from './routes/darkhubRoutes';
import roomsRoutes from './routes/roomsRoutes';
import aiAssetsRoutes from './routes/aiAssetsRoutes';
import serverRoomsRoutes from './routes/serverRoomsRoutes';
import { getDb } from './db';
import { getWSServer } from './ws/wsServer';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const WS_ENABLED = process.env.WS_ENABLED !== 'false';

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost', 'http://frontend'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/nodes/:node_id', nodeRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/security-guild', securityGuildRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/darkhub', darkhubRoutes);
app.use('/api', roomsRoutes);
app.use('/api/ai-assets', aiAssetsRoutes);
app.use('/api/server-rooms', serverRoomsRoutes);

// Health Check
app.get('/health', async (req, res) => {
    try {
        const pool = getDb();
        await pool.query('SELECT 1');
        const wsServer = getWSServer();
        const wsStats = wsServer.getStats();
        res.json({ 
            status: 'ok', 
            db: 'connected',
            ws: {
                enabled: WS_ENABLED,
                online: wsStats.onlineCount,
                shards: wsStats.shardCounts
            }
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', db: err.message });
    }
});

// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
    const wsServer = getWSServer();
    res.json(wsServer.getStats());
});

// Initialize and start server
async function startServer() {
    // Initialize WebSocket server if enabled
    if (WS_ENABLED) {
        const wsServer = getWSServer({
            port: Number(PORT),
            enableRedis: process.env.REDIS_URL !== undefined,
            redisUrl: process.env.REDIS_URL
        });
        await wsServer.init(httpServer);
        console.log(`[Server] WebSocket server initialized`);
    }

    httpServer.listen(PORT, () => {
        console.log(`[Server] HTTP server running on port ${PORT}`);
        console.log(`[Server] WebSocket: ${WS_ENABLED ? 'enabled' : 'disabled'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('[Server] SIGTERM received, shutting down...');
        if (WS_ENABLED) {
            await getWSServer().shutdown();
        }
        httpServer.close(() => {
            console.log('[Server] HTTP server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', async () => {
        console.log('[Server] SIGINT received, shutting down...');
        if (WS_ENABLED) {
            await getWSServer().shutdown();
        }
        httpServer.close(() => {
            console.log('[Server] HTTP server closed');
            process.exit(0);
        });
    });
}

startServer().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
