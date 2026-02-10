import { io, Socket } from 'socket.io-client';
import { GAME_CONFIG, WS_EVENTS } from '@/utils/Constants';

export type WSEventCallback = (data: any) => void;

export class WebSocketClient {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, WSEventCallback[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('authToken');
    
    this.socket = io(GAME_CONFIG.WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupConnectionHandlers();
    this.setupEventForwarding();
  }

  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on(WS_EVENTS.CONNECT, () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on(WS_EVENTS.DISCONNECT, (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, attempt reconnect
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    });

    this.socket.on(WS_EVENTS.RECONNECT, (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on(WS_EVENTS.ERROR, (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private setupEventForwarding(): void {
    this.eventHandlers.forEach((handlers, event) => {
      this.socket?.on(event, (data) => {
        handlers.forEach(handler => handler(data));
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, handler: WSEventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    // If already connected, attach the handler
    if (this.socket) {
      this.socket.on(event, (data) => handler(data));
    }
  }

  off(event: string, handler?: WSEventCallback): void {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.eventHandlers.delete(event);
    }

    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Cannot emit event:', event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Typed event helpers for common events
  onChatMessage(handler: WSEventCallback): void {
    this.on(WS_EVENTS.CHAT_MESSAGE, handler);
  }

  onPvPMatchFound(handler: WSEventCallback): void {
    this.on(WS_EVENTS.PVP_MATCH_FOUND, handler);
  }

  onNotification(handler: WSEventCallback): void {
    this.on(WS_EVENTS.NOTIFICATION_PUSH, handler);
  }

  sendChatMessage(channel: string, message: string): void {
    this.emit(WS_EVENTS.CHAT_MESSAGE, { channel, message });
  }
}

export const wsClient = new WebSocketClient();
