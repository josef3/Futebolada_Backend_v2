import express from 'express';

import { authenticateToken } from '../middleware/auth.middleware';

import { getPlayerInfoByToken } from '../controllers/player';


const router = express.Router();

router.get('/', authenticateToken, getPlayerInfoByToken);

export default router;