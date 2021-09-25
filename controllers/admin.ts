import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../db_connection';
import { IRequest, IResponse } from '../interfaces';

export async function register(req: IRequest, res: IResponse) {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const { rows } = await createAdmin(username, hashedPassword, role ?? 'read-only');

        const accessToken = jwt.sign(
            {
                id_admin: rows[0].id_admin,
                username,
                role
            },
            String(process.env.ACCESS_TOKEN_SECRET),
            { expiresIn: role === 'admin' ? '7d' : '1y' }
        );

        res.status(201).send({ accessToken });
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
}

export async function login(req: IRequest, res: IResponse) {
    const { username, password } = req.body;
    try {
        const { rows, rowCount } = await pool.query('SELECT id_admin, password, role FROM admin WHERE username LIKE $1', [username]);
        if (!rowCount) {
            throw new Error('Username doesnt exist!');
        }
        if (!bcrypt.compareSync(password, rows[0].password)) {
            throw new Error('Wrong password!');
        }

        //The JWT token will contain the id and role info.
        //Expiration date: 7 days -> admin
        //                 1 day -> read-only admin
        const accessToken = jwt.sign(
            {
                id_admin: rows[0].id_admin,
                role: rows[0].role
            },
            String(process.env.ACCESS_TOKEN_SECRET),
            { expiresIn: rows[0].role === 'admin' ? '7d' : '1d' }
        );

        res.status(200).send({ accessToken, username: rows[0].username });
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
}

//HELPER FUNCTIONS

async function createAdmin(username: string, password: string, role: 'admin' | 'read-only') {
    try {
        const result = await pool.query('INSERT INTO admin(username, password, role) VALUES ($1, $2, $3) RETURNING id_admin', [username, password, role]);
        if (result.rowCount < 1) {
            throw new Error('Error on Admin creation');
        }
        return result;
    }
    catch (error) {
        throw error;
    }
}