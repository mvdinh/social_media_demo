import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    this.socket = io(SOCKET_URL, {
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  sendMessage(username: string, content: string): void {
    if (this.socket) {
      this.socket.emit('sendMessage', { username, content });
    }
  }

  onNewMessage(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  onPeerUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('peerUpdate', callback);
    }
  }

  onBlockchainUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('blockchainUpdate', callback);
    }
  }
}

export default new SocketService();