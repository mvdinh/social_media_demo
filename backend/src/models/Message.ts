import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageDoc extends Document {
  sender: string;
  content: string;
  blockHash: string;
  blockIndex: number;
  timestamp: Date;
  verified: boolean;
}

const MessageSchema = new Schema({
  sender: {
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

export default mongoose.model<IMessageDoc>('Message', MessageSchema);