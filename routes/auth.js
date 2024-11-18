import { Router } from 'express';
import {Login,Logout} from '../controllers/auth.js';
const router = Router();
router.post('/login',Login);
router.get('/logout',Logout);
export default router;