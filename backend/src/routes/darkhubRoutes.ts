import express from 'express';
import { DarkHubService } from '../services/darkhubService';
import { pool } from '../db';

const router = express.Router();
const darkhub = new DarkHubService(pool);

router.get('/items', async (_req, res) => {
  try {
    const items = await darkhub.listItems();
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/buy', async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    const result = await darkhub.buy(userId, Number(itemId));
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
