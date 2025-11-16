import express from 'express';
import {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
} from '../controllers/newsController.js';

const router = express.Router();

// Routes for News
router.post('/news', createNews); // Create news
router.get('/news', getAllNews); // Get all news
router.get('/news/:id', getNewsById); // Get news by ID
router.put('/news/:id', updateNews); // Update news
router.delete('/news/:id', deleteNews); // Delete news

export default router;
