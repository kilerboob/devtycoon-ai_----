import express from 'express';
import { MarketService } from '../services/marketService';
import { pool } from '../db';

const router = express.Router();
const market = new MarketService(pool);

router.get('/items', async (req, res) => {
  try {
    const { category } = req.query as { category?: string };
    const items = await market.listItems(category);
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sell', async (req, res) => {
  try {
    const { userId, itemId, quantity, unitPrice } = req.body;
    const result = await market.sell(userId, Number(itemId), Number(quantity), Number(unitPrice));
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/buy', async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;
    const result = await market.buy(userId, Number(itemId), Number(quantity));
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
