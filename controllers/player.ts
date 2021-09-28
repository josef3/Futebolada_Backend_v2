import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { pool } from '../db_connection';

import PlayerIdNotFoundException from '../exceptions/PlayerIdNotFoundException';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import { IRequest, IResponse, INext } from '../interfaces';


const PLAYER_MAIN_INFO = 'id_player::integer, first_name, last_name, avatar';


export async function getPlayerInfoByToken(req: IRequest, res: IResponse, next: INext) {
    try {
        const { rows, rowCount } = await pool.query(`
        SELECT ${PLAYER_MAIN_INFO} 
        FROM player 
        WHERE id_player = $1`, [req.id_player]);

        if (!rowCount) {
            return next(new PlayerIdNotFoundException(String(req.id_player)));
        }
        res.send(rows[0]);
    }
    catch (error) {
        next(error);
    }
}

export async function login(req: IRequest, res: IResponse, next: INext) {
    const { username, password } = req.body;
    try {
        const player = await pool.query(`
        SELECT id_player::integer, password 
        FROM player 
        WHERE username LIKE $1`, [username]);
        //player with this username does not exist
        if (!player.rowCount) {
            return next(new WrongCredentialsException());
        }
        //wrong password
        if (!bcrypt.compareSync(password, player.rows[0].password)) {
            return next(new WrongCredentialsException());
        }
        const accessToken = signAccessToken(player.rows[0].id_player);
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