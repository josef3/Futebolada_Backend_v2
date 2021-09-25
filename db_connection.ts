import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? __dirname + '/.env' : __dirname + '/.env.dev'
});

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false }
});