import express from 'express';
import { register, login, getProfile, updateUser } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.patch('/update', auth, updateUser);

export default router;