import mongoose, { Schema, Document } from 'mongoose';

export interface IDeck extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  tags: { 
    type: [String], 
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
DeckSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IDeck>('Deck', DeckSchema);