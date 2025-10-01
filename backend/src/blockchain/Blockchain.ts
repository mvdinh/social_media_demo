import { Block, IMessage } from './Block';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public pendingMessages: IMessage[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingMessages = [];
  }

  private createGenesisBlock(): Block {
    const genesisMessage: IMessage = {
      sender: 'System',
      content: 'Genesis Block',
      timestamp: Date.now()
    };
    return new Block(0, Date.now(), genesisMessage, '0');
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addMessage(message: IMessage): Block {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      message,
      this.getLatestBlock().hash
    );
    
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    
    return newBlock;
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getChain(): Block[] {
    return this.chain;
  }
}