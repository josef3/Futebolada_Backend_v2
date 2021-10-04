import express from 'express';

import { getWeekById, getWeeks } from '../controllers/week';

const router = express.Router();

router.get('/', getWeeks);
router.get('/:id', getWeekById);

export default router;