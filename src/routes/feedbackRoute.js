import express from 'express';
import { createFeedback, getAllFeedbacks } from '../controllers/feedbackController.js';
import { authenticate } from '../middlewares/authentication.js'; // Authentication middleware

const router = express.Router();

// POST: Create feedback
router.post('/feedbacks', authenticate, createFeedback);

// GET: Get all feedbacks
router.get('/feedbacks', getAllFeedbacks);

export default router;
