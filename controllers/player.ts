import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { pool } from '../db_connection';
import { IRequest, IResponse, INext } from '../interfaces';

import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import IdNotFoundException from '../exceptions/IdNotFoundException';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import EmptyFieldException from '../exceptions/EmptyFieldException';

import { hashPassword } from '../utils';


const PLAYER_MAIN_INFO = 'id_player, first_name, last_name, avatar, username';


export async function getPlayerInfoByToken(req: IRequest, res: IResponse, next: INext) {
    try {
        const { rows, rowCount } = await pool.query(`
        SELECT ${PLAYER_MAIN_INFO}
        FROM player 
        WHERE id_player = $1`, [req.id_player]);

        if (!rowCount) {
            return next(new IdNotFoundException(String(req.id_player), 'jogador'));
        }
        res.send(rows[0]);
    }
    catch (error) {
        next(error);
    }
}

export async function getPlayersInfo(req: IRequest, res: IResponse, next: INext) {
    try {
        const { rows: players } = await pool.query(`
        SELECT ${PLAYER_MAIN_INFO} 
        FROM player 
        ORDER BY first_name, last_name`);
        res.send(players);
    }
    catch (error) {
        next(error);
    }
}

export async function getPlayerInfoById(req: IRequest, res: IResponse, next: INext) {
    const { id } = req.params;
    try {
        const { rows, rowCount } = await pool.query(`
        SELECT ${PLAYER_MAIN_INFO}
        FROM player 
        WHERE id_player = $1`, [id]);

        if (!rowCount) {
            return next(new IdNotFoundException(id, 'jogador'));
        }
        res.send(rows[0]);
    }
    catch (error) {
        next(error);
    }
}

export async function changePassword(req: IRequest, res: IResponse, next: INext) {
    const { password } = req.body;
    if (!password?.trim().length) {
        return next(new EmptyFieldException('password'));
    }
    if (!req.id_player) {
        return next(new NotAuthorizedException());
    }
    try {
        const hashedPassword = hashPassword(password);
        const { rowCount } = await pool.query('UPDATE player SET password = $1 WHERE id_player = $2', [hashedPassword, req.id_player]);
        if (!rowCount) {
            next(new Error());
        }
        res.sendStatus(201);
    }
    catch (error) {
        next(error);
    }
}

export async function resetPassword(req: IRequest, res: IResponse, next: INext) {
    const { id } = req.params;
    try {
        const { rows, rowCount } = await pool.query(`SELECT username FROM player WHERE id_player = $1`, [id]);
        if (!rowCount) {
            return next(new IdNotFoundException(id, 'jogador'));
        }
        //by default the password is equal to username
        const hashedPassword = hashPassword(rows[0].username);
        const { rowCount: updateRowCount } = await pool.query('UPDATE player SET password = $1 WHERE id_player = $2', [hashedPassword, id]);
        if (!updateRowCount) {
            next(new Error());
        }
        res.sendStatus(201);
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
        SELECT id_player::integer, password 
        FROM player 
        WHERE username LIKE $1`, [username]);
        //player with this username does not exist
        if (!rowCount) {
            return next(new WrongCredentialsException());
        }
        //wrong password
        if (!bcrypt.compareSync(password, rows[0].password)) {
            return next(new WrongCredentialsException());
        }
        const accessToken = signAccessToken(rows[0].id_player);
        res.status(200).send({ accessToken });
    }
    catch (error) {
        next(error);
    }
}

// HELPER FUNCTIONS

const signAccessToken = (id_player: number) => jwt.sign(
    { id_player },
    String(process.env.ACCESS_TOKEN_SECRET),
    { expiresIn: '150d' }
);