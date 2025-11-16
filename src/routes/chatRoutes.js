import express from 'express';
import { initializeChat, getMessages, markMessagesAsRead, sendMessage } from '../controllers/chatController.js';
import { authenticate } from '../middlewares/authentication.js';

const router = express.Router();

router.post('/initialize/:projectId/:applicantId', authenticate, initializeChat);
router.get('/messages/:chatId', authenticate, getMessages);
router.put('/read/:chatId', authenticate, markMessagesAsRead);
router.post('/send/:chatId', authenticate, sendMessage);


export default router;