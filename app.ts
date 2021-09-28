import express from 'express';
import cors from 'cors';

import errorMiddleware from './middleware/error.middleware';

import adminRoute from './routes/admin';
import playerRoute from './routes/player';

const app = express();

app.use(express.json());
app.use(cors());
app.use('/favicon.ico', express.static('images/football.ico'));
app.disable('x-powered-by');

app.get('/', (req, res) => res.json('Welcome to Futebolada Backend!'));

app.use('/api/v2/admin', adminRoute);
app.use('/api/v2/player', playerRoute);

app.use(errorMiddleware);

export default app;