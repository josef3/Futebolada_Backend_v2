import request from 'supertest';
import app from '../app';

describe('GET /', () => {
    test(`It should return 200 & the welcome message`, async () => {
        const res = await request(app).get('');

        expect(res.status).toBe(200);
        expect(res.body).toBe('Welcome to Futebolada Backend!');
    });
});