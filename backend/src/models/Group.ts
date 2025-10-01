import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  avatar?: string;
  members: {
    userId: mongoose.Types.ObjectId;
    username: string;
    role: 'admin' | 'member';
    joinedAt: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  isPrivate: boolean;
}

const GroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
});

// Index để tìm kiếm nhanh
GroupSchema.index({ 'members.userId': 1 });

export default mongoose.model<IGroup>('Group', GroupSchema);