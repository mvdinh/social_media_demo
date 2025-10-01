import mongoose, { Document, Schema } from 'mongoose';

export interface IPrivateMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderUsername: string;
  receiverId: mongoose.Types.ObjectId;
  receiverUsername: string;
  content: string;
  conversationId: string;
  blockHash: string;
  blockIndex: number;
  timestamp: Date;
  read: boolean;
  verified: boolean;
}

const PrivateMessageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverUsername: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  blockHash: {
    type: String,
    required: true
  },
  blockIndex: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: true
  }
});

// Index cho tìm kiếm conversation
PrivateMessageSchema.index({ conversationId: 1, timestamp: 1 });

export default mongoose.model<IPrivateMessage>('PrivateMessage', PrivateMessageSchema);