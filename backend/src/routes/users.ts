import express, { Router } from 'express';
import { Types } from 'mongoose';
import User, { IUser } from '../models/User';
import UserStatus from '../models/UserStatus';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Tìm kiếm users
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { query } = req.query;

    const users: IUser[] = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username email walletAddress')
      .limit(20);

    // Lấy status của users
    const userIds = users.map(u => u._id); // _id: Types.ObjectId
    const statuses = await UserStatus.find({ userId: { $in: userIds } });

    const usersWithStatus = users.map(user => {
      const status = statuses.find(
        s => s.userId.toString() === (user._id as Types.ObjectId).toString()
      );
      return {
        ...user.toObject(),
        status: status?.status || 'offline',
        lastSeen: status?.lastSeen
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lấy danh sách users online
router.get('/online', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const onlineUsers = await UserStatus.find({ status: 'online' });
    res.json(onlineUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
