import request from 'supertest';
import app from '../app';
import { pool } from '../db_connection';

import EmptyFieldException from '../exceptions/EmptyFieldException';
import IdNotFoundException from '../exceptions/IdNotFoundException';
import InvalidAuthTokenException from '../exceptions/InvalidAuthTokenException';
import UnauthorizedException from '../exceptions/UnauthorizedException';

const API_URL = '/api/v2/weeks';

let playerToken = '';
let superAdminToken = '';
let readOnlyAdminToken = '';

beforeAll(async () => {
    const { body: player } = await request(app).post(`/api/v2/players/login`)
        .send({ username: 'test.purposes', password: 'test.purposes' });
    playerToken = player.accessToken;

    const { body: superAdmin } = await request(app).post(`/api/v2/admin/login`)
        .send({ username: 'testsuperadmin', password: 'superadmin' });
    superAdminToken = superAdmin.accessToken;

    const { body: readOnlyAdmin } = await request(app).post(`/api/v2/admin/login`)
        .send({ username: 'testreadonly', password: 'readonly' });
    readOnlyAdminToken = readOnlyAdmin.accessToken;
});

describe('GET /weeks', () => {
    test(`It should return 200 & all weeks info ordered by date descending`, async () => {
        const res = await request(app).get(`${API_URL}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(Object.keys(res.body[0]).length).toBe(4);
        expect(res.body[0]).toHaveProperty('id_week');
        expect(res.body[0]).toHaveProperty('date');
        expect(res.body[0]).toHaveProperty('vote_finished');
        expect(res.body[0]).toHaveProperty('vote_finish_date');

        //check if its ordered by date descending by comparing the first two results data
        expect(res.body[0].date > res.body[1].date).toBeTruthy();
    });
});

describe('GET /weeks/:id', () => {
    test(`It should return 200 & info of the week with the given id`, async () => {
        const res = await request(app).get(`${API_URL}/18`);

        expect(res.status).toBe(200);
        expect(Object.keys(res.body).length).toBe(4);
        expect(res.body).toHaveProperty('id_week');
        expect(res.body.id_week).toBe(18);
        expect(res.body).toHaveProperty('date');
        expect(res.body).toHaveProperty('vote_finished');
        expect(res.body).toHaveProperty('vote_finish_date');
    });

    test(`It should return 404 if doesn't exist a week with the given id`, async () => {
        const res = await request(app).get(`${API_URL}/15555`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe(new IdNotFoundException('15555', 'semana').message);
    });
});

describe('POST /weeks', () => {
    function addDays(days: number) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + days);
        return tomorrow;
    }

    test(`It should return 400 if date was not sent`, async () => {
        const res = await request(app).post(`${API_URL}`)
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('data').message);
    });

    test(`It should return 400 if date is higher than the time right now`, async () => {
        const res = await request(app).post(`${API_URL}`)
            .send({ date: addDays(1) })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('A data não pode ser superior à data atual');
    });

    test(`It should return 400 if voteFinishDate is higher or equal than the date sent`, async () => {
        const res = await request(app).post(`${API_URL}`)
            .send({
                date: new Date(),
                voteFinishDate: addDays(-1)
            })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('A data de término de votação não pode ser inferior à data do jogo');

        const res2 = await request(app).post(`${API_URL}`)
            .send({
                date: new Date(),
                voteFinishDate: new Date()
            })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe('A data de término de votação não pode ser inferior à data do jogo');
    });

    test(`It should return 400 if already exists a week for the date given`, async () => {
        const res = await request(app).post(`${API_URL}`)
            .send({ date: '2021-09-27' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Já existe uma semana para este dia');
    });

    test(`It should return 401 if an invalid or no access token is sent`, async () => {
        const res = await request(app).post(`${API_URL}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);

        const res2 = await request(app).post(`${API_URL}`)
            .set({ Authorization: 'Bearer invalid.access.token' });

        expect(res2.status).toBe(401);
        expect(res2.body.message).toBe(new InvalidAuthTokenException().message);
    });

    test(`It should return 403 if an ordinary player or an admin with read-only role tries to create a week`, async () => {
        const res = await request(app).post(`${API_URL}`)
            .set({ Authorization: 'Bearer ' + playerToken });;

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(new UnauthorizedException().message);

        const res2 = await request(app).post(`${API_URL}`)
            .set({ Authorization: 'Bearer ' + readOnlyAdminToken });

        expect(res2.status).toBe(403);
        expect(res2.body.message).toBe(new UnauthorizedException().message);
    });
});

afterAll(async () => {
    await pool.end();
});