import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCredits extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  lastUpdated: Date;
}

const UserCreditsSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUserCredits>('UserCredits', UserCreditsSchema);