import { Router } from 'express';
import { Login, Logout, getProfile,changePassword } from '../controllers/auth.js';
const router = Router();
router.post('/login',Login);
router.get('/logout',Logout);
router.get('/profile',getProfile);
router.put('/:id', changePassword);
export default router;