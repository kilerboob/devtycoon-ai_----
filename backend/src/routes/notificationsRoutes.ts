import { Router } from 'express';
import { messagesService } from '../services/messagesService';

const router = Router();

/**
 * GET /api/notifications/:user_id - Get user notifications
 */
router.get('/:user_id', async (req, res) => {
  try {
    const { unreadOnly = false } = req.query;
    const notifications = await messagesService.getUserNotifications(
      req.params.user_id,
      unreadOnly === 'true'
    );
    res.json(notifications);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/notifications - Create notification
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, type, title, content, related_id } = req.body;

    if (!user_id || !type || !title || !content) {
      return res.status(400).json({ error: 'user_id, type, title, and content are required' });
    }

    const notification = await messagesService.createNotification(
      user_id,
      type,
      title,
      content,
      related_id
    );

    if (!notification) {
      return res.status(500).json({ error: 'Failed to create notification' });
    }

    res.status(201).json(notification);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/notifications/read - Mark notifications as read
 */
router.put('/read', async (req, res) => {
  try {
    const { user_id, notification_ids } = req.body;

    if (!user_id || !notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json({ error: 'user_id and notification_ids array are required' });
    }

    const result = await messagesService.markNotificationsAsRead(user_id, notification_ids);

    if (!result) {
      return res.status(500).json({ error: 'Failed to mark notifications as read' });
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
