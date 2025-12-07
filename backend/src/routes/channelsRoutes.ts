import { Router } from 'express';
import { messagesService } from '../services/messagesService';

const router = Router();

/**
 * GET /api/channels - Get all channels
 */
router.get('/', async (req, res) => {
  try {
    const channels = await messagesService.getChannels();
    res.json(channels);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to get channels' });
  }
});

/**
 * GET /api/channels/:id - Get channel by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const channel = await messagesService.getChannel(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/channels - Create new channel
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, description, owner_id, is_private } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    const channel = await messagesService.createChannel(
      name,
      type,
      description,
      owner_id,
      is_private || false
    );

    if (!channel) {
      return res.status(500).json({ error: 'Failed to create channel' });
    }

    res.status(201).json(channel);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/channels/:id/messages - Get messages from channel
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await messagesService.getChannelMessages(
      req.params.id,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    res.json(messages);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/channels/:id/messages - Post message to channel
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const { sender_id, sender_name, content, mentions } = req.body;

    if (!sender_id || !content) {
      return res.status(400).json({ error: 'sender_id and content are required' });
    }

    const message = await messagesService.postMessage(
      req.params.id,
      sender_id,
      content,
      sender_name,
      mentions || []
    );

    if (!message) {
      return res.status(500).json({ error: 'Failed to post message' });
    }

    res.status(201).json(message);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
