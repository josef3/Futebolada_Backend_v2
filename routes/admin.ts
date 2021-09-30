import express from 'express';

import { isSuperAdmin } from '../middleware/isSuperAdmin.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

import { deleteAdmin, login, register } from '../controllers/admin';

const router = express.Router();

router.post('/login', login);
router.post('/register', authenticateToken, isSuperAdmin, register);
router.delete('/:id', authenticateToken, isSuperAdmin, deleteAdmin);

export default router;