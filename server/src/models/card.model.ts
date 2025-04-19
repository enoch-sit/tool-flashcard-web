import mongoose, { Schema, Document } from 'mongoose';

interface ReviewRecord {
  date: Date;
  performance: number; // 1-5 rating
}

export interface ICard extends Document {
  deckId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  difficulty: number; // 1-5 rating
  nextReviewDate: Date;
  reviewHistory: ReviewRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewRecordSchema = new Schema({
  date: {
    type: Date,
    default: Date.now
  },
  performance: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  }
}, { _id: false });

const CardSchema: Schema = new Schema({
  deckId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Deck'
  },
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  reviewHistory: {
    type: [ReviewRecordSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
CardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ICard>('Card', CardSchema);