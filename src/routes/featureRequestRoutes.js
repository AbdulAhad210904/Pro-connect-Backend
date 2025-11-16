import express from 'express';
import { createRequest,getAllRequests,upvoteRequest,downvoteRequest } from '../controllers/featureRequestController.js';
import { authenticate } from '../middlewares/authentication.js'; // Authentication middleware

const router = express.Router();

// POST: Create feedback
router.post('/requests', authenticate, createRequest);

// GET: Get all feedbacks
router.get('/requests', getAllRequests);

router.post('/requests/:requestId/upvote', authenticate, upvoteRequest); // Upvote a feature request
router.post('/requests/:requestId/downvote', authenticate, downvoteRequest); // Downvote a feature request

export default router;
