import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditPackage extends Document {
  name: string;
  description: string;
  credits: number;
  price: number; // in cents
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CreditPackageSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
CreditPackageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ICreditPackage>('CreditPackage', CreditPackageSchema);