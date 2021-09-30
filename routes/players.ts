import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { isSuperAdmin } from '../middleware/isSuperAdmin.middleware';

import {
    getPlayersInfo,
    getPlayerInfoById,
    login,
    changePassword,
    resetPassword
} from '../controllers/player';

const router = express.Router();

router.get('/', getPlayersInfo);
router.get('/:id', getPlayerInfoById);

router.post('/login', login);
router.put('/password-change', authenticateToken, changePassword);
router.put('/:id/password-reset', authenticateToken, isSuperAdmin, resetPassword);

export default router;