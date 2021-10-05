import { pool } from '../db_connection';
import { IRequest, IResponse, INext } from '../interfaces';

import IdNotFoundException from '../exceptions/IdNotFoundException';
import EmptyFieldException from '../exceptions/EmptyFieldException';
import HttpException from '../exceptions/HttpException';

import { addDays } from '../utils';


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

export async function createWeek(req: IRequest, res: IResponse, next: INext) {
    const { date, voteFinishDate } = req.body;
    if (!date) {
        return next(new EmptyFieldException('data'));
    }
    if (new Date(date) > new Date()) {
        return next(new HttpException(400, 'A data não pode ser superior à data atual'));
    }
    if (new Date(voteFinishDate) <= new Date(date)) {
        return next(new HttpException(400, 'A data de término de votação não pode ser inferior à data do jogo'));
    }

    const voteFinish = voteFinishDate || addDays(date);
    try {
        const check = await checkWeekExistenceByDate(new Date(date));
        if (check.rowCount) {
            throw new HttpException(400, 'Já existe uma semana para este dia');
        }

        const { rows, rowCount } = await pool.query(`
        INSERT INTO week(date, vote_finish_date) 
        VALUES ($1, $2)
        RETURNING id_week`, [new Date(date), voteFinish]);
        if (!rowCount) {
            throw new Error();
        }
        res.status(201).send({ idWeek: rows[0].id_week });
    }
    catch (error) {
        next(error);
    }
}


//HELPER functions

async function checkWeekExistenceByDate(date: Date) {
    try {
        const res = await pool.query(`SELECT * 
        FROM week 
        WHERE date = $1`, [date]);

        return res;
    }
    catch (error) {
        throw new Error();
    }
}