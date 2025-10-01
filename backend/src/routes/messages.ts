import express, { Router } from 'express';
import Message from '../models/Message';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Lấy tất cả tin nhắn
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;