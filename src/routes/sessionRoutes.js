import express from 'express';
import { authenticate } from '../middlewares/authentication.js';
import { disconnectSession, getConnectedBrowsers } from '../controllers/sessionController.js';

const router = express.Router();

router.get('/getConnectedBrowsers',authenticate, getConnectedBrowsers);
router.post('/disconnectSessionData',authenticate, disconnectSession);


export default router;