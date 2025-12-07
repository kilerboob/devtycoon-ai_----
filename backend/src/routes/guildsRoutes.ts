import { Router } from 'express';
import { messagesService } from '../services/messagesService';

const router = Router();

/**
 * GET /api/guilds - Get all guilds
 */
router.get('/', async (req, res) => {
  try {
    const guilds = await messagesService.getGuilds();
    res.json(guilds);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/guilds - Create new guild
 */
router.post('/', async (req, res) => {
  try {
    const { name, owner_id, description } = req.body;

    if (!name || !owner_id) {
      return res.status(400).json({ error: 'name and owner_id are required' });
    }

    const guild = await messagesService.createGuild(
      name,
      owner_id,
      description || ''
    );

    if (!guild) {
      return res.status(500).json({ error: 'Failed to create guild' });
    }

    res.status(201).json(guild);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
