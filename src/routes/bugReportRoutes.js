import express from 'express';
import { createBugReport, getAllBugReports } from '../controllers/bugReportController.js';
import { authenticate } from '../middlewares/authentication.js'; // Authentication middleware

const router = express.Router();

// Route to create a bug report
router.post('/bug-reports', authenticate, createBugReport);

// Route to get all bug reports
router.get('/bug-reports', getAllBugReports);

export default router;
