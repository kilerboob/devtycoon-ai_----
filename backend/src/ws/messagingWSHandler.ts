import WebSocket from 'ws';
import { messagesService } from '../services/messagesService';

interface MessageClient {
  ws: WebSocket;
  user_id: string;
  channel_ids: Set<string>;
}

export class MessagingWSHandler {
  private clients: Map<string, MessageClient> = new Map();

  /**
   * Handle new WebSocket connection for messaging
   */
  handleConnection(ws: WebSocket, user_id: string) {
    const clientId = `${user_id}-${Date.now()}`;
    const client: MessageClient = {
      ws,
      user_id,
      channel_ids: new Set()
    };

    this.clients.set(clientId, client);
    console.log(`[Messaging WS] User ${user_id} connected (${this.clients.size} total)`);

    ws.on('message', (data: string) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnect(clientId));
    ws.on('error', (err) => this.handleError(clientId, err));

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      user_id,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(clientId: string, data: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message);
          break;
        case 'message':
          await this.handleNewMessage(clientId, message);
          break;
        case 'typing':
          this.broadcastToChannel(message.channel_id, {
            type: 'user_typing',
            user_id: client.user_id,
            channel_id: message.channel_id,
            timestamp: new Date().toISOString()
          }, clientId);
          break;
        default:
          console.log(`[Messaging WS] Unknown message type: ${message.type}`);
      }
    } catch (e: any) {
      console.error(`[Messaging WS] Error handling message:`, e.message);
      client.ws.send(JSON.stringify({
        type: 'error',
        message: e.message
      }));
    }
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { channel_id } = message;
    if (!channel_id) return;

    client.channel_ids.add(channel_id);
    console.log(`[Messaging WS] User ${client.user_id} subscribed to channel ${channel_id}`);

    client.ws.send(JSON.stringify({
      type: 'subscribed',
      channel_id,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { channel_id } = message;
    if (!channel_id) return;

    client.channel_ids.delete(channel_id);
    console.log(`[Messaging WS] User ${client.user_id} unsubscribed from channel ${channel_id}`);
  }

  /**
   * Handle new message
   */
  private async handleNewMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { channel_id, content, mentions } = message;
    if (!channel_id || !content) return;

    try {
      // Save message to database
      const savedMessage = await messagesService.postMessage(
        channel_id,
        client.user_id,
        content,
        message.sender_name || client.user_id,
        mentions || []
      );

      if (savedMessage) {
        // Broadcast to all subscribers of this channel
        this.broadcastToChannel(channel_id, {
          type: 'new_message',
          message: savedMessage,
          timestamp: new Date().toISOString()
        });

        // Create mention notifications if there are mentions
        if (mentions && mentions.length > 0) {
          await messagesService.createMentionNotifications(
            savedMessage.id,
            channel_id,
            client.user_id,
            mentions
          );

          // Notify mentioned users
          this.broadcastToUsers(mentions, {
            type: 'mentioned',
            channel_id,
            message_id: savedMessage.id,
            sender: client.user_id,
            content: `You were mentioned in ${channel_id}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e: any) {
      console.error(`[Messaging WS] Error posting message:`, e.message);
      client.ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to post message: ${e.message}`
      }));
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`[Messaging WS] User ${client.user_id} disconnected`);
      this.clients.delete(clientId);
    }
  }

  /**
   * Handle error
   */
  private handleError(clientId: string, err: Error) {
    console.error(`[Messaging WS] Error on client ${clientId}:`, err.message);
  }

  /**
   * Broadcast message to all users in a channel
   */
  private broadcastToChannel(channel_id: string, data: any, excludeClientId?: string) {
    const message = JSON.stringify(data);
    this.clients.forEach((client, clientId) => {
      if (client.channel_ids.has(channel_id) && clientId !== excludeClientId) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      }
    });
  }

  /**
   * Broadcast message to specific users
   */
  private broadcastToUsers(user_ids: string[], data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (user_ids.includes(client.user_id)) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      }
    });
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      activeChannels: new Set(
        Array.from(this.clients.values()).flatMap(c => Array.from(c.channel_ids))
      ).size
    };
  }
}

export const messagingWSHandler = new MessagingWSHandler();
