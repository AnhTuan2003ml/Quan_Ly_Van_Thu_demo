import { Router } from 'express';
import {Get_vb_den,Post_vb_den,Put_vb_den,Delete} from '../controllers/vb_den.js';

const router = Router();
router.get('/',Get_vb_den);
router.put('/:id',Put_vb_den);
router.post('/',Post_vb_den);
router.delete('/:id',Delete);

export default router;