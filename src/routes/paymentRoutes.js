import express from 'express';
import { createPayment, paymentWebhook,getPaymentDetails, getPaymentDetailsByUserId } from '../controllers/paymentController.js';
const router = express.Router();
router.post('/create-payment', createPayment);
router.post('/payment-webhook', paymentWebhook);
router.get("/payments/:id", getPaymentDetails);
router.get("/payments/user/:userId", getPaymentDetailsByUserId);
export default router;