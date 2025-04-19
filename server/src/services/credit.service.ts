import { UserCredits, CreditTransaction } from '../models';

class CreditService {
  async getUserBalance(userId: string): Promise<number> {
    const userCredit = await UserCredits.findOne({ userId });
    return userCredit ? userCredit.balance : 0;
  }

  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= amount;
  }

  async deductCredits(
    userId: string, 
    amount: number, 
    description: string, 
    transactionType: string
  ): Promise<boolean> {
    // Start a session for transaction
    const session = await UserCredits.startSession();
    session.startTransaction();

    try {
      // Update user balance
      const userCredit = await UserCredits.findOneAndUpdate(
        { userId },
        { $inc: { balance: -amount }, $set: { lastUpdated: new Date() } },
        { session, new: true, upsert: true }
      );

      // Record transaction
      await CreditTransaction.create([{
        userId,
        amount: -amount,
        description,
        transactionType,
        createdAt: new Date()
      }], { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async addCredits(
    userId: string, 
    amount: number, 
    description: string, 
    transactionType: string
  ): Promise<boolean> {
    // Similar to deductCredits but with positive amount
    const session = await UserCredits.startSession();
    session.startTransaction();

    try {
      const userCredit = await UserCredits.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount }, $set: { lastUpdated: new Date() } },
        { session, new: true, upsert: true }
      );

      await CreditTransaction.create([{
        userId,
        amount: amount,
        description,
        transactionType,
        createdAt: new Date()
      }], { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getTransactionHistory(userId: string, limit = 20, page = 1): Promise<any> {
    const skip = (page - 1) * limit;
    
    const transactions = await CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await CreditTransaction.countDocuments({ userId });
    
    return {
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new CreditService();