import express from 'express';
import { createProfile, getProfile, updateProfile } from '../controllers/craftsmanProfileController.js';
import { authenticate } from '../middlewares/authentication.js';
import { verifyCraftsman } from '../middlewares/authorization.js';
const router = express.Router();

router.post('/createProfile',authenticate, createProfile);
router.get('/getProfile',authenticate, getProfile);
router.put('/updateProfile',authenticate, updateProfile);

export default router;

//authenticate,verifyCraftsman,