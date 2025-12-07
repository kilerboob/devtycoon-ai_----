import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'global' | 'guild' | 'corporate' | 'dm';
  owner_id?: string;
  is_private: boolean;
  member_count: number;
  created_at: Date;
  metadata?: any;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  mentions: string[];
  is_edited: boolean;
  edited_at?: Date;
  reactions?: Record<string, string[]>;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'mention' | 'quest' | 'achievement' | 'social' | 'system';
  title: string;
  content?: string;
  related_id?: string;
  is_read: boolean;
  created_at: Date;
  metadata?: any;
}

export interface Guild {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  member_count: number;
  level: number;
  treasury: number;
  logo_url?: string;
  banner_url?: string;
  is_recruiting: boolean;
  created_at: Date;
}

class MessagesService {
  /**
   * Get all channels
   */
  async getChannels(includePrivate = false): Promise<Channel[]> {
    try {
      const pool = getDb();
      const query = includePrivate
        ? 'SELECT * FROM channels ORDER BY created_at DESC'
        : 'SELECT * FROM channels WHERE NOT is_private ORDER BY created_at DESC';
      
      const { rows } = await pool.query(query);
      return rows;
    } catch (error: any) {
      console.error('[MessagesService] Get channels error:', error.message);
      return [];
    }
  }

  /**
   * Get channel by ID
   */
  async getChannel(channelId: string): Promise<Channel | null> {
    try {
      const pool = getDb();
      const { rows } = await pool.query(
        'SELECT * FROM channels WHERE id = $1',
        [channelId]
      );
      return rows[0] || null;
    } catch (error: any) {
      console.error('[MessagesService] Get channel error:', error.message);
      return null;
    }
  }

  /**
   * Get channel by name
   */
  async getChannelByName(name: string): Promise<Channel | null> {
    try {
      const pool = getDb();
      const { rows } = await pool.query(
        'SELECT * FROM channels WHERE name = $1',
        [name]
      );
      return rows[0] || null;
    } catch (error: any) {
      console.error('[MessagesService] Get channel by name error:', error.message);
      return null;
    }
  }

  /**
   * Create new channel
   */
  async createChannel(
    name: string,
    type: 'global' | 'guild' | 'corporate' | 'dm',
    description?: string,
    owner_id?: string,
    is_private = false
  ): Promise<Channel | null> {
    try {
      const pool = getDb();
      const id = uuidv4();
      
      const { rows } = await pool.query(
        `INSERT INTO channels (id, name, type, description, owner_id, is_private)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, name, type, description || '', owner_id || null, is_private]
      );

      console.log(`[MessagesService] ✅ Channel created: ${id} (${name})`);
      return rows[0];
    } catch (error: any) {
      console.error('[MessagesService] Create channel error:', error.message);
      return null;
    }
  }

  /**
   * Post message to channel
   */
  async postMessage(
    channel_id: string,
    sender_id: string,
    content: string,
    sender_name?: string,
    mentions: string[] = []
  ): Promise<Message | null> {
    try {
      const pool = getDb();
      const id = uuidv4();

      const { rows } = await pool.query(
        `INSERT INTO messages (id, channel_id, sender_id, sender_name, content, mentions)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, channel_id, sender_id, sender_name || 'Anonymous', content, mentions]
      );

      const message = rows[0];

      // Create mention notifications
      if (mentions.length > 0) {
        await this.createMentionNotifications(id, channel_id, sender_id, mentions);
      }

      console.log(`[MessagesService] ✅ Message posted: ${id}`);
      return message;
    } catch (error: any) {
      console.error('[MessagesService] Post message error:', error.message);
      return null;
    }
  }

  /**
   * Get messages from channel
   */
  async getChannelMessages(channel_id: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      const pool = getDb();
      const { rows } = await pool.query(
        `SELECT * FROM messages 
         WHERE channel_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [channel_id, limit, offset]
      );
      return rows.reverse(); // Return in chronological order
    } catch (error: any) {
      console.error('[MessagesService] Get messages error:', error.message);
      return [];
    }
  }

  /**
   * Create mention notifications
   */
  async createMentionNotifications(
    message_id: string,
    channel_id: string,
    sender_id: string,
    mentioned_users: string[]
  ): Promise<void> {
    try {
      const pool = getDb();

      for (const user_id of mentioned_users) {
        await pool.query(
          `INSERT INTO mentions (id, message_id, channel_id, sender_id, mentioned_user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), message_id, channel_id, sender_id, user_id]
        );
      }

      console.log(`[MessagesService] ✅ Created mention notifications for ${mentioned_users.length} users`);
    } catch (error: any) {
      console.error('[MessagesService] Create mentions error:', error.message);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(user_id: string, unreadOnly = false): Promise<Notification[]> {
    try {
      const pool = getDb();
      const query = unreadOnly
        ? `SELECT * FROM notifications 
           WHERE user_id = $1 AND is_read = false 
           ORDER BY created_at DESC 
           LIMIT 50`
        : `SELECT * FROM notifications 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 50`;

      const { rows } = await pool.query(query, [user_id]);
      return rows;
    } catch (error: any) {
      console.error('[MessagesService] Get notifications error:', error.message);
      return [];
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    user_id: string,
    type: string,
    title: string,
    content?: string,
    related_id?: string,
    metadata?: any
  ): Promise<Notification | null> {
    try {
      const pool = getDb();
      const id = uuidv4();

      const { rows } = await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, content, related_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, user_id, type, title, content || '', related_id || null, metadata || {}]
      );

      return rows[0];
    } catch (error: any) {
      console.error('[MessagesService] Create notification error:', error.message);
      return null;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(user_id: string, notification_ids?: string[]): Promise<boolean> {
    try {
      const pool = getDb();

      if (notification_ids && notification_ids.length > 0) {
        await pool.query(
          `UPDATE notifications 
           SET is_read = true, read_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1 AND id = ANY($2)`,
          [user_id, notification_ids]
        );
      } else {
        await pool.query(
          `UPDATE notifications 
           SET is_read = true, read_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1`,
          [user_id]
        );
      }

      return true;
    } catch (error: any) {
      console.error('[MessagesService] Mark as read error:', error.message);
      return false;
    }
  }

  /**
   * Create guild
   */
  async createGuild(
    name: string,
    owner_id: string,
    description?: string
  ): Promise<Guild | null> {
    try {
      const pool = getDb();
      const id = uuidv4();

      const { rows } = await pool.query(
        `INSERT INTO guilds (id, name, owner_id, description, member_count)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, name, owner_id, description || '', 1]
      );

      // Add owner as member
      await pool.query(
        `INSERT INTO guild_members (guild_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [id, owner_id, 'owner']
      );

      // Create guild-general channel
      const channel = await this.createChannel(
        `${name}-general`,
        'guild',
        `General channel for ${name}`,
        owner_id,
        false
      );

      if (channel) {
        await pool.query(
          `INSERT INTO guild_channels (guild_id, channel_id, channel_name)
           VALUES ($1, $2, $3)`,
          [id, channel.id, `${name}-general`]
        );
      }

      console.log(`[MessagesService] ✅ Guild created: ${id} (${name})`);
      return rows[0];
    } catch (error: any) {
      console.error('[MessagesService] Create guild error:', error.message);
      return null;
    }
  }

  /**
   * Get all guilds
   */
  async getGuilds(): Promise<Guild[]> {
    try {
      const pool = getDb();
      const { rows } = await pool.query('SELECT * FROM guilds ORDER BY created_at DESC');
      return rows;
    } catch (error: any) {
      console.error('[MessagesService] Get guilds error:', error.message);
      return [];
    }
  }
}

export const messagesService = new MessagesService();
