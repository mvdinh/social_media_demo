import mongoose, { Document, Schema } from 'mongoose';

export interface IUserStatus extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  socketId?: string;
}

const UserStatusSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  }
});

export default mongoose.model<IUserStatus>('UserStatus', UserStatusSchema);
