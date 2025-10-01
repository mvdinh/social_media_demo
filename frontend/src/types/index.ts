export interface User {
  id: string;
  username: string;
  email: string;
  walletAddress: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  blockHash: string;
  blockIndex: number;
  timestamp: string;
  verified: boolean;
}

export interface BlockchainInfo {
  chainLength: number;
  isValid: boolean;
  difficulty: number;
  peers: number;
  latestBlock: unknown;
}

export interface AuthResponse {
  token: string;
  user: User;
}