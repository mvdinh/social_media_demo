import express, { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router: Router = express.Router();

// Lấy thông tin blockchain
router.get('/info', authMiddleware, (req, res) => {
  const blockchain = (req.app as any).blockchain;
  const p2pNetwork = (req.app as any).p2pNetwork;
  
  res.json({
    chainLength: blockchain.chain.length,
    isValid: blockchain.isChainValid(),
    difficulty: blockchain.difficulty,
    peers: p2pNetwork.getPeerCount(),
    latestBlock: blockchain.getLatestBlock()
  });
});

// Lấy toàn bộ chain
router.get('/chain', authMiddleware, (req, res) => {
  const blockchain = (req.app as any).blockchain;
  res.json(blockchain.getChain());
});

export default router;