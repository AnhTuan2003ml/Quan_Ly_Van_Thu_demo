import { Router } from 'express';
import {readLogData,deleteLogByType} from '../controllers/log.js';
const router = Router();

router.get('/:type', readLogData);
router.delete('/:type',deleteLogByType)

export default router;