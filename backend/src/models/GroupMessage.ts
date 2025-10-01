import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderUsername: string;
  content: string;
  blockHash: string;
  blockIndex: number;
  timestamp: Date;
  verified: boolean;
}

const GroupMessageSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
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
  verified: {
    type: Boolean,
    default: true
  }
});

GroupMessageSchema.index({ groupId: 1, timestamp: 1 });

export default mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);
