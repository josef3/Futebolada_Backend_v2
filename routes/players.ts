import express from 'express';
import { getPlayers } from '../controllers/player';

const router = express.Router();

router.get('/', getPlayers);

export default router;