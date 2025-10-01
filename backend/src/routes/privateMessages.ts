import express, { Router } from 'express';
import PrivateMessage from '../models/PrivateMessage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router: Router = express.Router();

// Lấy danh sách conversations
router.get('/conversations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const conversations = await PrivateMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.timestamp': -1 } }
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lấy tin nhắn của một conversation
router.get('/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const messages = await PrivateMessage.find({
      conversationId,
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ timestamp: 1 }).limit(100);

    // Đánh dấu đã đọc
    await PrivateMessage.updateMany(
      {
        conversationId,
        receiverId: userId,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;  