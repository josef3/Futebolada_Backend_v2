import request from 'supertest';
import app from '../app';
import { pool } from '../db_connection';
import IdNotFoundException from '../exceptions/IdNotFoundException';

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

afterAll(async () => {
    await pool.end();
});