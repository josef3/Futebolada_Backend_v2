import { pool } from '../db_connection';
import { IRequest, IResponse } from '../interfaces';


export async function getPlayers(req: IRequest, res: IResponse) {
    try {
        const { rows } = await pool.query('SELECT id_player, first_name, last_name, avatar, username FROM player ORDER BY first_name, last_name');
        res.send(rows);
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
}