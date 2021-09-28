import { pool } from '../db_connection';
import request from 'supertest';
import app from '../app';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';

const API_URL = '/api/v2/player';

// let playerAccessToken = '';

// beforeAll(async () => {
//     const response = await request(app).post('/api/v2/players/login')
//         .send({ username: 'test.purposes', password: 'test.purposes' });
//     playerAccessToken = response.body.accessToken;
// })

describe('POST /players/login', () => {
    test(`It should return 200 & the player (that is requesting it) info`, async () => {
        const res = await request(app).post('/api/v2/players/login')
            .send({ username: 'test.purposes', password: 'test.purposes' });

        expect(res.status).toBe(200);
        expect(Object.keys(res.body).length).toBe(1);
        expect(res.body).toHaveProperty('accessToken');
    });

    test(`It should return 401 if the username doesn't exist`, async () => {
        const res = await request(app).post('/api/v2/players/login')
            .send({ username: 'doesnt.exist', password: 'doesnt.exist' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new WrongCredentialsException().message);
    });

    test(`It should return 401 if the password is wrong`, async () => {
        const res = await request(app).post('/api/v2/players/login')
            .send({ username: 'test.purposes', password: 'wrong.password' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new WrongCredentialsException().message);
    });
});

afterAll(async () => {
    await pool.end();
});