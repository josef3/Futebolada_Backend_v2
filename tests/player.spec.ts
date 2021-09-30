import request from 'supertest';
import app from '../app';
import { pool } from '../db_connection';

import InvalidAuthTokenException from '../exceptions/InvalidAuthTokenException';

const API_URL = '/api/v2/player';

let playerAccessToken = '';

beforeAll(async () => {
    const response = await request(app).post('/api/v2/players/login')
        .send({ username: 'test.purposes', password: 'test.purposes' });
    playerAccessToken = response.body.accessToken;
})

describe('GET /player', () => {
    test(`It should return 200 & the player (that is requesting it) info`, async () => {
        const res = await request(app).get(`${API_URL}`)
            .set({ Authorization: 'Bearer ' + playerAccessToken });

        expect(res.status).toBe(200);
        expect(Object.keys(res.body).length).toBe(5);
        expect(res.body).toHaveProperty('id_player');
        expect(res.body.id_player).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('first_name');
        expect(res.body.first_name).toBe('Test');
        expect(res.body).toHaveProperty('last_name');
        expect(res.body.last_name).toBe('Purposes');
        expect(res.body).toHaveProperty('avatar');
        expect(res.body.avatar).toBe('https://futebolada.s3.eu-west-2.amazonaws.com/test_purposes.jpg');
    });

    test(`It should return 401 if the auth token is invalid or has expired`, async () => {
        const res = await request(app).get(`${API_URL}`)
            .set({ Authorization: 'Bearer invalid.token.or.expired' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);
    });

    test(`It should return 401 if the auth token was not sent`, async () => {
        const res = await request(app).get(`${API_URL}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);
    });
});

afterAll(async () => {
    await pool.end();
});