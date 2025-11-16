import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: String,
  status: { type: String, enum: ['success', 'pending', 'failed'], required: true }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;