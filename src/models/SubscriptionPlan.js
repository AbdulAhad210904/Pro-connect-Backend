import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    enum: ['BASIC', 'PRO', 'PREMIUM'] 
  },
  price: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'EUR' 
  },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'yearly', 'free'],
    required: true 
  },
  features: [String],
  privateContacts: { 
    type: Number, 
    default: function() {
      switch(this.name) {
        case 'BASIC': return 1;
        case 'PRO': return 15;
        case 'PREMIUM': return -1;
        default: return 0;
      }
    }
  }
}, { timestamps: true });

const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planName: {
    type: String,
    enum: ['BASIC', 'PRO', 'PREMIUM'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'free'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentHistory: [{
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    amount: Number,
    date: Date,
    status: String
  }],
  autoRenew: {
    type: Boolean,
    default: true
  },
  contactsUsed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Update Payment Schema
const paymentSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription'
  },
  mollieId: { 
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
  planDetails: {
    name: {
      type: String,
      enum: ['PRO', 'PREMIUM'],
      required: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true
    }
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);

export { Payment, SubscriptionPlan, UserSubscription };