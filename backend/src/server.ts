// ============================================
// FILE: backend/src/server.ts
// ============================================
import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { Blockchain } from './blockchain/Blockchain';
import { P2PNetwork } from './blockchain/P2PNetwork';

import Message from './models/Message';
import PrivateMessage from './models/PrivateMessage';
import GroupMessage from './models/GroupMessage';
import Group from './models/Group';
import UserStatus from './models/UserStatus';

import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import blockchainRoutes from './routes/blockchain';
import groupRoutes from './routes/groups';
import privateMessageRoutes from './routes/privateMessages';
import groupMessageRoutes from './routes/groupMessages';
import userRoutes from './routes/users';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Khởi tạo Blockchain và P2P Network
const blockchain = new Blockchain();
const p2pNetwork = new P2PNetwork();

(app as any).blockchain = blockchain;
(app as any).p2pNetwork = p2pNetwork;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/private-messages', privateMessageRoutes);
app.use('/api/group-messages', groupMessageRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    blockchain: blockchain.chain.length,
    peers: p2pNetwork.getPeerCount()
  });
});

// Store user socket mappings
const userSockets = new Map<string, string>(); // userId -> socketId

// Helper function: Tạo conversation ID
function createConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  let currentUserId: string | null = null;
  let currentUsername: string | null = null;

  // User authentication
  socket.on('authenticate', async (data: { userId: string; username: string }) => {
    try {
      currentUserId = data.userId;
      currentUsername = data.username;

      // Lưu socket mapping
      userSockets.set(currentUserId, socket.id);

      // Join room cá nhân
      socket.join(`user_${currentUserId}`);

      // Cập nhật user status
      await UserStatus.findOneAndUpdate(
        { userId: currentUserId },
        {
          userId: currentUserId,
          username: currentUsername,
          status: 'online',
          lastSeen: new Date(),
          socketId: socket.id
        },
        { upsert: true, new: true }
      );

      // Join tất cả group rooms mà user là thành viên
      const groups = await Group.find({ 'members.userId': currentUserId });
      groups.forEach(group => {
        socket.join(`group_${group._id}`);
      });

      // Broadcast user online status
      io.emit('userStatusUpdate', {
        userId: currentUserId,
        username: currentUsername,
        status: 'online',
        lastSeen: new Date()
      });

      // Thêm peer vào P2P network
      p2pNetwork.addPeer(socket.id);

      // Gửi danh sách users online
      const onlineUsers = await UserStatus.find({ status: 'online' });
      socket.emit('onlineUsers', onlineUsers);

      // Gửi peer update
      io.emit('peerUpdate', {
        peerCount: p2pNetwork.getPeerCount(),
        peers: p2pNetwork.getPeers()
      });

      console.log(`✅ User authenticated: ${currentUsername} (${currentUserId})`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  // Gửi tin nhắn công khai (Global chat)
  socket.on('sendGlobalMessage', async (data: { content: string }) => {
    try {
      if (!currentUserId || !currentUsername) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Thêm vào blockchain
      const block = blockchain.addMessage({
        sender: currentUsername,
        content: data.content,
        timestamp: Date.now()
      });

      // Lưu vào MongoDB
      const message = new Message({
        sender: currentUsername,
        content: data.content,
        blockHash: block.hash,
        blockIndex: block.index,
        verified: true
      });
      await message.save();

      // Broadcast block
      p2pNetwork.broadcast(block);

      // Gửi tin nhắn đến tất cả clients
      io.emit('newGlobalMessage', {
        id: message._id,
        sender: currentUsername,
        content: data.content,
        blockHash: block.hash,
        blockIndex: block.index,
        timestamp: message.timestamp,
        verified: true
      });

      // Cập nhật thông tin blockchain
      io.emit('blockchainUpdate', {
        chainLength: blockchain.chain.length,
        isValid: blockchain.isChainValid(),
        latestBlock: block
      });
    } catch (error) {
      console.error('Error sending global message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Gửi tin nhắn riêng tư
  socket.on('sendPrivateMessage', async (data: {
    receiverId: string;
    receiverUsername: string;
    content: string
  }) => {
    try {
      if (!currentUserId || !currentUsername) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const conversationId = createConversationId(currentUserId, data.receiverId);

      // Thêm vào blockchain
      const block = blockchain.addMessage({
        sender: currentUsername,
        content: data.content,
        timestamp: Date.now()
      });

      // Lưu vào MongoDB
      const message = new PrivateMessage({
        senderId: currentUserId,
        senderUsername: currentUsername,
        receiverId: data.receiverId,
        receiverUsername: data.receiverUsername,
        content: data.content,
        conversationId,
        blockHash: block.hash,
        blockIndex: block.index,
        read: false,
        verified: true
      });
      await message.save();

      const messageData = {
        id: message._id,
        senderId: currentUserId,
        senderUsername: currentUsername,
        receiverId: data.receiverId,
        receiverUsername: data.receiverUsername,
        content: data.content,
        conversationId,
        blockHash: block.hash,
        blockIndex: block.index,
        timestamp: message.timestamp,
        read: false,
        verified: true
      };

      // Gửi cho người gửi
      socket.emit('newPrivateMessage', messageData);

      // Gửi cho người nhận (nếu online)
      io.to(`user_${data.receiverId}`).emit('newPrivateMessage', messageData);

    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  // Gửi tin nhắn nhóm
  socket.on('sendGroupMessage', async (data: {
    groupId: string;
    content: string
  }) => {
    try {
      if (!currentUserId || !currentUsername) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Kiểm tra user có trong nhóm không
      const group = await Group.findById(data.groupId);
      if (!group) {
        socket.emit('error', { message: 'Group not found' });
        return;
      }

      const isMember = group.members.some(m => m.userId.toString() === currentUserId);
      if (!isMember) {
        socket.emit('error', { message: 'You are not a member of this group' });
        return;
      }

      // Thêm vào blockchain
      const block = blockchain.addMessage({
        sender: currentUsername,
        content: data.content,
        timestamp: Date.now()
      });

      // Lưu vào MongoDB
      const message = new GroupMessage({
        groupId: data.groupId,
        senderId: currentUserId,
        senderUsername: currentUsername,
        content: data.content,
        blockHash: block.hash,
        blockIndex: block.index,
        verified: true
      });
      await message.save();

      const messageData = {
        id: message._id,
        groupId: data.groupId,
        senderId: currentUserId,
        senderUsername: currentUsername,
        content: data.content,
        blockHash: block.hash,
        blockIndex: block.index,
        timestamp: message.timestamp,
        verified: true
      };

      // Gửi cho tất cả thành viên trong nhóm
      io.to(`group_${data.groupId}`).emit('newGroupMessage', messageData);

    } catch (error) {
      console.error('Error sending group message:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Đánh dấu tin nhắn đã đọc
  socket.on('markAsRead', async (data: { conversationId: string }) => {
    try {
      if (!currentUserId) return;

      await PrivateMessage.updateMany(
        {
          conversationId: data.conversationId,
          receiverId: currentUserId,
          read: false
        },
        { read: true }
      );

      // Thông báo cho người gửi
      const messages = await PrivateMessage.find({
        conversationId: data.conversationId,
        senderId: { $ne: currentUserId }
      }).distinct('senderId');

      messages.forEach(senderId => {
        io.to(`user_${senderId}`).emit('messagesRead', {
          conversationId: data.conversationId,
          readBy: currentUserId
        });
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // User đang gõ (typing indicator)
  socket.on('typing', (data: { conversationId?: string; groupId?: string }) => {
    if (!currentUsername) return;

    if (data.conversationId) {
      // Private chat typing
      const [user1, user2] = data.conversationId.split('_');
      const otherUserId = user1 === currentUserId ? user2 : user1;
      io.to(`user_${otherUserId}`).emit('userTyping', {
        conversationId: data.conversationId,
        username: currentUsername
      });
    } else if (data.groupId) {
      // Group chat typing
      socket.to(`group_${data.groupId}`).emit('userTyping', {
        groupId: data.groupId,
        username: currentUsername
      });
    }
  });

  // User ngừng gõ
  socket.on('stopTyping', (data: { conversationId?: string; groupId?: string }) => {
    if (!currentUsername) return;

    if (data.conversationId) {
      const [user1, user2] = data.conversationId.split('_');
      const otherUserId = user1 === currentUserId ? user2 : user1;
      io.to(`user_${otherUserId}`).emit('userStoppedTyping', {
        conversationId: data.conversationId,
        username: currentUsername
      });
    } else if (data.groupId) {
      socket.to(`group_${data.groupId}`).emit('userStoppedTyping', {
        groupId: data.groupId,
        username: currentUsername
      });
    }
  });

  // Join group room (khi được thêm vào nhóm)
  socket.on('joinGroup', (data: { groupId: string }) => {
    socket.join(`group_${data.groupId}`);
    console.log(`User ${currentUsername} joined group ${data.groupId}`);
  });

  // Leave group room
  socket.on('leaveGroup', (data: { groupId: string }) => {
    socket.leave(`group_${data.groupId}`);
    console.log(`User ${currentUsername} left group ${data.groupId}`);
  });

  // Xử lý disconnect
  socket.on('disconnect', async () => {
    console.log('❌ User disconnected:', socket.id);

    if (currentUserId) {
      // Xóa socket mapping
      userSockets.delete(currentUserId);

      // Cập nhật user status
      await UserStatus.findOneAndUpdate(
        { userId: currentUserId },
        {
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        }
      );

      // Broadcast user offline status
      io.emit('userStatusUpdate', {
        userId: currentUserId,
        username: currentUsername,
        status: 'offline',
        lastSeen: new Date()
      });
    }

    p2pNetwork.removePeer(socket.id);

    io.emit('peerUpdate', {
      peerCount: p2pNetwork.getPeerCount(),
      peers: p2pNetwork.getPeers()
    });
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Kết nối database và khởi động server
const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`⛓️  Blockchain initialized with ${blockchain.chain.length} blocks`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});