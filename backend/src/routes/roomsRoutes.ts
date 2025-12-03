import { Router } from 'express';
import { roomsService, calculatePCPerformance } from '../services/roomsService';

const router = Router();

// List all rooms
router.get('/rooms', async (req, res) => {
  try {
    console.log('[GET /rooms] Request received');
    const rooms = await roomsService.listAllRooms();
    console.log('[GET /rooms] Found rooms:', rooms.length);
    res.json(rooms);
  } catch (e: any) {
    console.error('[GET /rooms] Error:', e);
    res.status(500).json({ error: e.message || 'Unknown error' });
  }
});

// List public rooms (multiplayer) - MUST be before /:roomId
router.get('/rooms/public', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const rooms = await roomsService.listPublicRooms(limit);
    res.json(rooms);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get single room by ID
router.get('/rooms/:roomId', async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const room = await roomsService.getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'not_found' });
    res.json(room);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// List user's rooms - This might conflict, consider renaming endpoint
router.get('/rooms/owner/:ownerId', async (req, res) => {
  try {
    const rooms = await roomsService.listRooms(req.params.ownerId);
    res.json(rooms);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create room
router.post('/rooms', async (req, res) => {
  try {
    console.log('[POST /rooms] Request body:', req.body);
    const { ownerId, name, theme } = req.body;
    const room = await roomsService.createRoom(ownerId, name, theme);
    console.log('[POST /rooms] Room created:', room);
    res.json(room);
  } catch (e: any) {
    console.error('[POST /rooms] Error:', e);
    res.status(500).json({ error: e.message || 'Unknown error' });
  }
});

// Update room
router.patch('/rooms/:roomId', async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const room = await roomsService.updateRoom(roomId, req.body);
    res.json(room);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Delete room
router.delete('/rooms/:roomId', async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    await roomsService.deleteRoom(roomId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Room items
router.get('/rooms/:roomId/items', async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const items = await roomsService.listItems(roomId);
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/rooms/:roomId/items', async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const item = await roomsService.upsertItem(roomId, req.body);
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/items/:itemId', async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    await roomsService.removeItem(itemId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PC components
router.get('/pc/components/:userId', async (req, res) => {
  try {
    const list = await roomsService.listPcComponents(req.params.userId);
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/pc/upgrade', async (req, res) => {
  try {
    const { userId, componentType, model, stats, roomId } = req.body;
    const comp = await roomsService.upgradePcComponent(userId, componentType, model, stats, roomId);
    res.json(comp);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get PC performance stats
router.get('/pc/performance/:userId', async (req, res) => {
  try {
    const components = await roomsService.listPcComponents(req.params.userId);
    const performance = calculatePCPerformance(components);
    res.json({ components, performance });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;