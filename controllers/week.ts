import { pool } from '../db_connection';
import { IRequest, IResponse, INext } from '../interfaces';

import IdNotFoundException from '../exceptions/IdNotFoundException';


export async function getWeeks(req: IRequest, res: IResponse, next: INext) {
    try {
        const { rows: weeks } = await pool.query(`
        SELECT * 
        FROM week 
        ORDER BY date DESC`);

        res.send(weeks);
    }
    catch (error) {
        next(error);
    }
}

export async function getWeekById(req: IRequest, res: IResponse, next: INext) {
    const { id } = req.params;
    try {
        const { rows, rowCount } = await pool.query(`
        SELECT *
        FROM week 
        WHERE id_week = $1`, [id]);
        if (!rowCount) {
            return next(new IdNotFoundException(id, 'semana'));
        }
        res.send(rows[0]);
    }
    catch (error) {
        next(error);
    }
}