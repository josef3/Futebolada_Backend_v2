import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { pool } from '../db_connection';
import { INext, IRequest, IResponse } from '../interfaces';

import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import UsernameInUseException from '../exceptions/UsernameInUseException';
import EmptyFieldException from '../exceptions/EmptyFieldException';
import IdNotFoundException from '../exceptions/IdNotFoundException';
import InvalidValueException from '../exceptions/InvalidValueException';

import { hashPassword } from '../utils';


export async function register(req: IRequest, res: IResponse, next: INext) {
    const { username, password, role } = req.body;
    if (!username?.trim().length) {
        return next(new EmptyFieldException('username'));
    }
    if (!password?.trim().length) {
        return next(new EmptyFieldException('password'));
    }
    if (role && (role !== 'admin' && role !== 'read-only')) {
        return next(new InvalidValueException('role'));
    }
    try {
        const hashedPassword = hashPassword(password);
        const { rows } = await createAdmin(username, hashedPassword, role ?? 'read-only');

        const accessToken = signAccessToken(rows[0].id_admin, username, role ?? 'read-only');
        res.status(201).send({ accessToken, id: rows[0].id_admin });
    }
    catch (error) {
        next(error);
    }
}

export async function login(req: IRequest, res: IResponse, next: INext) {
    const { username, password } = req.body;
    if (!username?.trim().length) {
        return next(new EmptyFieldException('username'));
    }
    if (!password?.trim().length) {
        return next(new EmptyFieldException('password'));
    }
    try {
        const { rows, rowCount } = await pool.query(`
        SELECT id_admin, username, password, role 
        FROM admin 
        WHERE username LIKE $1`, [username]);
        if (!rowCount) {
            throw new WrongCredentialsException();
        }
        if (!bcrypt.compareSync(password, rows[0].password)) {
            throw new WrongCredentialsException();
        }
        const accessToken = signAccessToken(rows[0].id_admin, rows[0].username, rows[0].role);
        res.status(200).send({ accessToken, username: rows[0].username });
    }
    catch (error) {
        next(error);
    }
}

export async function deleteAdmin(req: IRequest, res: IResponse, next: INext) {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query('DELETE FROM admin WHERE id_admin = $1', [id]);
        if (!rowCount) {
            return next(new IdNotFoundException(id, 'admin'));
        }
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
}

//HELPER FUNCTIONS

async function checkUsernameExistence(username: string) {
    try {
        const { rowCount } = await pool.query(`
        SELECT username 
        FROM admin 
        WHERE LOWER(username) LIKE $1`, [username.toLowerCase()]);
        return rowCount > 0;
    }
    catch (error) {
        throw error;
    }
}

async function createAdmin(username: string, password: string, role: 'admin' | 'read-only') {
    try {
        const usernameAlreadyExists = await checkUsernameExistence(username);
        if (usernameAlreadyExists) {
            throw new UsernameInUseException(username);
        }
        const result = await pool.query(`
        INSERT 
        INTO admin(username, password, role) 
        VALUES ($1, $2, $3) 
        RETURNING id_admin`, [username, password, role]);
        if (!result.rowCount) {
            throw new Error();
        }
        return result;
    }
    catch (error) {
        throw error;
    }
}

//The JWT token will contain the id, username and role info.
//Expiration date: 7 days -> admin
//                 1 day -> read-only admin
const signAccessToken = (id_admin: number, username: string, role: 'admin' | 'read-only') => jwt.sign(
    {
        id_admin,
        username,
        role
    },
    String(process.env.ACCESS_TOKEN_SECRET),
    { expiresIn: role === 'admin' ? '7d' : '1d' }
);