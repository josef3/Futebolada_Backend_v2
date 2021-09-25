import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());
app.use('/favicon.ico', express.static('images/football.ico'));
app.disable('x-powered-by');

app.get('/', (req, res) => res.send("Welcome to Futebolada Backend!"));

export default app;