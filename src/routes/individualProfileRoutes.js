import express from 'express';
import { createProfile, getProfile, updateProfile } from '../controllers/individualProfileController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createProfile);
router.get('/:userId', auth, getProfile);
router.patch('/:userId', auth, updateProfile);

export default router;