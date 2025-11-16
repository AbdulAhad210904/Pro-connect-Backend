import express from 'express';
import { register, login, getUser, updateUser, updatePassword, updateDisableStatus, updateDeleteStatus,  checkEmailVerificationStatus, checkPhoneVerificationStatus, sendEmailVerificationCode, verifyEmailVerificationCode, sendPhoneVerificationCode, verifyPhoneVerificationCode, sendPasswordUpdateVerificationCodeToEmail, updatePasswordWithCode,updateTokenAfterPayment } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authentication.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// router.get('/:id', auth, getUser);
// router.patch('/:id', auth, updateUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.put('/updatepassword', authenticate,updatePassword);
router.put('/updatedisablestatus', authenticate,updateDisableStatus);
router.put('/updatedeletestatus', authenticate,updateDeleteStatus);
router.post('/sendEmailVerificationCode', authenticate,sendEmailVerificationCode);
router.post('/verifyEmailVerificationCode',authenticate,verifyEmailVerificationCode);


router.post('/checkEmailVerificationStatus',authenticate, checkEmailVerificationStatus);
router.post('/checkPhoneVerificationStatus',authenticate, checkPhoneVerificationStatus);


router.post('/sendPhoneVerificationCode',authenticate, sendPhoneVerificationCode);
router.post('/verifyPhoneVerificationCode',authenticate, verifyPhoneVerificationCode);

router.post('/sendpasswordcode', sendPasswordUpdateVerificationCodeToEmail);
router.post('/updatePasswordWithCode', updatePasswordWithCode);

router.post('/getnewtoken', authenticate, updateTokenAfterPayment);
export default router;