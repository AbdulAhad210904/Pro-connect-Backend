import mongoose from 'mongoose';

// Define the payment schema
const paymentSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    mollieId:{ 
        type: String,
        unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    checkoutUrl: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'canceled'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Middleware to update `updatedAt` on every save
paymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create a payment model
const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
