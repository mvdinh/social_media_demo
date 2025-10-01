import { EventEmitter } from 'events';
import { Block } from './Block';

export class P2PNetwork extends EventEmitter {
  private peers: Set<string>;
  
  constructor() {
    super();
    this.peers = new Set();
  }

  addPeer(peerId: string): void {
    this.peers.add(peerId);
    this.emit('peerConnected', peerId);
  }

  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    this.emit('peerDisconnected', peerId);
  }

  broadcast(block: Block): void {
    this.emit('blockBroadcast', block);
  }

  getPeers(): string[] {
    return Array.from(this.peers);
  }

  getPeerCount(): number {
    return this.peers.size;
  }
}