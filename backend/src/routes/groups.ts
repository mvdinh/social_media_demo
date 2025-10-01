import express, { Router } from 'express';
import Group from '../models/Group';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router: Router = express.Router();

// Tạo nhóm mới
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const userId = req.userId;
    const username = req.username;

    const group = new Group({
      name,
      description,
      isPrivate: isPrivate || false,
      createdBy: userId,
      members: [{
        userId,
        username,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lấy danh sách nhóm của user
router.get('/my-groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    
    const groups = await Group.find({
      'members.userId': userId
    }).sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lấy thông tin nhóm
router.get('/:groupId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Kiểm tra user có trong nhóm không
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Thêm thành viên vào nhóm
router.post('/:groupId/members', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body; // Array of user IDs
    const currentUserId = req.userId;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Kiểm tra quyền admin
    const currentMember = group.members.find(m => m.userId.toString() === currentUserId);
    if (!currentMember || currentMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    // Thêm members
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (!user) continue;

      // Kiểm tra đã là member chưa
      const exists = group.members.some(m => m.userId.toString() === userId);
      if (!exists) {
        group.members.push({
          userId: new mongoose.Types.ObjectId(userId),
          username: user.username,
          role: 'member',
          joinedAt: new Date()
        });
      }
    }

    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Xóa thành viên khỏi nhóm
router.delete('/:groupId/members/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.userId;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Kiểm tra quyền admin
    const currentMember = group.members.find(m => m.userId.toString() === currentUserId);
    if (!currentMember || currentMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    // Không cho phép xóa creator
    if (group.createdBy.toString() === userId) {
      return res.status(403).json({ error: 'Cannot remove group creator' });
    }

    group.members = group.members.filter(m => m.userId.toString() !== userId);
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Thăng cấp/hạ cấp admin
router.patch('/:groupId/members/:userId/role', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.userId;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Chỉ creator mới có quyền thay đổi role
    if (group.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'Only group creator can change roles' });
    }

    const member = group.members.find(m => m.userId.toString() === userId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    member.role = role;
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Rời nhóm
router.post('/:groupId/leave', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Không cho phép creator rời nhóm
    if (group.createdBy.toString() === userId) {
      return res.status(403).json({ error: 'Group creator cannot leave. Delete the group instead.' });
    }

    group.members = group.members.filter(m => m.userId.toString() !== userId);
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;