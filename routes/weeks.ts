import express from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import { isSuperAdmin } from '../middleware/isSuperAdmin.middleware';

import { getWeekById, getWeeks, createWeek } from '../controllers/week';

const router = express.Router();

router.get('/', getWeeks);
router.get('/:id', getWeekById);
router.post('/', authenticateToken, isSuperAdmin, createWeek);

export default router;