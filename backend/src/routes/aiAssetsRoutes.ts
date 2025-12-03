import { Router } from 'express';
import { aiAssetsService } from '../services/aiAssetsService';

const router = Router();

// Generate new AI asset
router.post('/generate', async (req, res) => {
  try {
    const { prompt, type, style } = req.body;
    
    if (!prompt || !type) {
      return res.status(400).json({ error: 'prompt and type are required' });
    }
    
    const asset = await aiAssetsService.generateAsset({ prompt, type, style });
    await aiAssetsService.saveAsset(asset);
    
    res.json(asset);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get asset by ID
router.get('/:asset_id', async (req, res) => {
  try {
    const asset = await aiAssetsService.getAsset(req.params.asset_id);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// List all assets
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const assets = await aiAssetsService.listAssets(type as string);
    res.json(assets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
