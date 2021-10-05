import express from 'express';

import { getWeekById, getWeeks, createWeek } from '../controllers/week';

const router = express.Router();

router.get('/', getWeeks);
router.get('/:id', getWeekById);
router.post('/', createWeek);

export default router;