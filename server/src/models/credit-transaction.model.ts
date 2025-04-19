import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number; // Positive for additions, negative for usage
  description: string;
  transactionType: string; // "PURCHASE", "ADMIN_GRANT", "CARD_CREATION", etc.
  createdAt: Date;
}

const CreditTransactionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['PURCHASE', 'ADMIN_GRANT', 'ADMIN_DEDUCTION', 'CARD_CREATION', 'REFUND', 'SIGNUP_BONUS']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);