import express, { Router } from 'express';
import GroupMessage from '../models/GroupMessage';
import Group from '../models/Group';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Lấy tin nhắn của nhóm
router.get('/:groupId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Kiểm tra user có trong nhóm không
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const messages = await GroupMessage.find({ groupId })
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;