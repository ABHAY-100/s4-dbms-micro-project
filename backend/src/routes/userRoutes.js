import express from 'express';
import { register, login, getProfile, updateUser, getAllStaff, updateUserStatus, logout } from '../controllers/userController.js';
import { userAuth } from '../middleware/userAuth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', userAuth, logout);
router.get('/profile', userAuth, getProfile);
router.patch('/update', userAuth, updateUser);

router.get('/staff', userAuth, adminAuth, getAllStaff);
router.put('/staff/status', userAuth, adminAuth, updateUserStatus);

export default router;
