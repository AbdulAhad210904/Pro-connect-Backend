import { createMollieClient } from '@mollie/api-client';
import { Payment, UserSubscription } from '../models/SubscriptionPlan.js';
import User from '../models/User.js';

const mollieClient = createMollieClient({ apiKey: 'test_fJvvB2AQwjGf5JnRmawPSgSu4zdwn3' });

const planPrices = {
  PRO: {
    monthly: 19.99,
    yearly: 191.90,
  },
  PREMIUM: {
    monthly: 49.99,
    yearly: 479.90,
  },
};

export const createPayment = async (req, res) => {
  try {
    const { 
      amount, 
      description, 
      redirectUrl, 
      webhookUrl, 
      paymentMethod,
      userId,
      planName,
      billingCycle 
    } = req.body;
    console.log(req.body);
    // Validate user exists and is a craftsman
    const user = await User.findById(userId);
    if (!user || user.userType !== 'craftsman') {
      return res.status(400).json({ error: 'Invalid user or user type' });
    }

    // Validate plan details
    if (!planPrices[planName] || !planPrices[planName][billingCycle]) {
      return res.status(400).json({ error: 'Invalid subscription plan details' });
    }

    // Verify amount matches plan price
    const expectedAmount = planPrices[planName][billingCycle];
    if (amount !== expectedAmount) {
      return res.status(400).json({ error: 'Invalid amount for selected plan' });
    }

    const customId = Math.random().toString(36).substring(7);

    // Create Mollie payment
    const molliePayment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2),
      },
      description,
      redirectUrl: `${redirectUrl}/${customId}`,
      webhookUrl,
      method: paymentMethod,
    });

    // Create payment record
    const newPayment = new Payment({
      customId,
      userId,
      mollieId: molliePayment.id,
      amount,
      description,
      paymentMethod,
      checkoutUrl: molliePayment.getCheckoutUrl(),
      planDetails: {
        name: planName,
        billingCycle
      }
    });

    await newPayment.save();

    res.json({ 
      paymentId: customId, 
      checkoutUrl: molliePayment.getCheckoutUrl() 
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({ customId: id })
      .populate('userId', 'firstName lastName email')
      .populate('subscriptionId');

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.mollieId) {
      try {
        const molliePayment = await mollieClient.payments.get(payment.mollieId);
        const mollieStatus = molliePayment.status;

        let paymentStatus = payment.paymentStatus;

        if (mollieStatus === 'paid') {
          paymentStatus = 'completed';
          
          // If payment is completed and subscription not created yet
          if (!payment.subscriptionId && paymentStatus === 'completed') {
            const subscriptionDuration = payment.planDetails.billingCycle === 'monthly' ? 30 : 365;
            
            const newSubscription = new UserSubscription({
              userId: payment.userId,
              planName: payment.planDetails.name,
              billingCycle: payment.planDetails.billingCycle,
              startDate: new Date(),
              endDate: new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000),
              paymentHistory: [{
                paymentId: payment._id,
                amount: payment.amount,
                date: new Date(),
                status: 'completed'
              }]
            });

            await newSubscription.save();
            
            payment.subscriptionId = newSubscription._id;
            await payment.save();
          }
        } else if (mollieStatus === 'open') {
          paymentStatus = 'pending';
        } else if (mollieStatus === 'failed') {
          paymentStatus = 'failed';
        } else if (mollieStatus === 'canceled') {
          paymentStatus = 'canceled';
        }

        if (paymentStatus !== payment.paymentStatus) {
          payment.paymentStatus = paymentStatus;
          await payment.save();
        }
      } catch (mollieError) {
        console.error("Error fetching Mollie payment details:", mollieError);
        return res.status(500).json({ error: "Failed to fetch Mollie payment details" });
      }
    }

    res.json({
      customId: payment.customId,
      mollieId: payment.mollieId,
      amount: payment.amount,
      description: payment.description,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      checkoutUrl: payment.checkoutUrl,
      user: payment.userId,
      subscription: payment.subscriptionId,
      planDetails: payment.planDetails
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
};

export const paymentWebhook = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing payment ID' });
    }

    const molliePayment = await mollieClient.payments.get(id);
    const payment = await Payment.findOne({ customId: id });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    let newStatus;
    if (molliePayment.isPaid()) {
      newStatus = 'completed';
      
      // Create subscription if payment is completed
      if (!payment.subscriptionId) {
        const subscriptionDuration = payment.planDetails.billingCycle === 'monthly' ? 30 : 365;
        
        const newSubscription = new UserSubscription({
          userId: payment.userId,
          planName: payment.planDetails.name,
          billingCycle: payment.planDetails.billingCycle,
          startDate: new Date(),
          endDate: new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000),
          paymentHistory: [{
            paymentId: payment._id,
            amount: payment.amount,
            date: new Date(),
            status: 'completed'
          }]
        });

        await newSubscription.save();
        
        payment.subscriptionId = newSubscription._id;
      }
    } else if (molliePayment.isOpen()) {
      newStatus = 'pending';
    } else if (molliePayment.isFailed()) {
      newStatus = 'failed';
    } else if (molliePayment.isCanceled()) {
      newStatus = 'canceled';
    }

    payment.paymentStatus = newStatus;
    await payment.save();

    console.log(`Payment ${id} status updated to ${payment.paymentStatus}`);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};

export const getPaymentDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch all payments for the user
    const payments = await Payment.find({ userId })
      .populate('subscriptionId')
      .sort({ createdAt: -1 }); // Sort by most recent first

    if (payments.length === 0) {
      return res.status(404).json({ error: 'No payments found for this user' });
    }

    // Fetch the active subscription for the user
    const activeSubscription = await UserSubscription.findOne({ 
      userId, 
      isActive: true 
    }).sort({ startDate: -1 });

    const paymentDetails = payments.map(payment => ({
      customId: payment.customId,
      mollieId: payment.mollieId,
      amount: payment.amount,
      description: payment.description,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      checkoutUrl: payment.checkoutUrl,
      planDetails: payment.planDetails,
      createdAt: payment.createdAt
    }));

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      activeSubscription: activeSubscription ? {
        planName: activeSubscription.planName,
        billingCycle: activeSubscription.billingCycle,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        isActive: activeSubscription.isActive,
        autoRenew: activeSubscription.autoRenew,
        contactsUsed: activeSubscription.contactsUsed
      } : null,
      payments: paymentDetails
    });
  } catch (error) {
    console.error("Error fetching payment details by user ID:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
};