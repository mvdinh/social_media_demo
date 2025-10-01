import crypto from 'crypto';

export interface IMessage {
  sender: string;
  content: string;
  timestamp: number;
}

export class Block {
  public hash: string;
  
  constructor(
    public index: number,
    public timestamp: number,
    public data: IMessage,
    public previousHash: string,
    public nonce: number = 0
  ) {
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty: number): void {
    const target = Array(difficulty + 1).join('0');
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}