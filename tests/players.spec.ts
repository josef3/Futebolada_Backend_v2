import request from 'supertest';
import app from '../app';
import { pool } from '../db_connection';

import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import InvalidAuthTokenException from '../exceptions/InvalidAuthTokenException';
import EmptyFieldException from '../exceptions/EmptyFieldException';
import IdNotFoundException from '../exceptions/IdNotFoundException';

const API_URL = '/api/v2/players';

let playerToken = '';
let superAdminToken = '';
let readOnlyAdminToken = '';

beforeAll(async () => {
    const { body: player } = await request(app).post(`${API_URL}/login`)
        .send({ username: 'test.purposes', password: 'test.purposes' });
    playerToken = player.accessToken;
    const { body: superAdmin } = await request(app).post(`/api/v2/admin/login`)
        .send({ username: 'testsuperadmin', password: 'superadmin' });
    superAdminToken = superAdmin.accessToken;
    const { body: readOnlyAdmin } = await request(app).post(`/api/v2/admin/login`)
        .send({ username: 'testreadonly', password: 'readonly' });
    readOnlyAdminToken = readOnlyAdmin.accessToken;
})

describe('POST /players/login', () => {
    test(`It should return 200 & the player (that is requesting it) info`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ username: 'test.purposes', password: 'test.purposes' });

        expect(res.status).toBe(200);
        expect(Object.keys(res.body).length).toBe(1);
        expect(res.body).toHaveProperty('accessToken');
    });

    test(`It should return 400 if the username or password was not sent`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ password: 'somepassword' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('username').message);

        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'test.purposes' });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('password').message);
    });

    test(`It should return 400 if the username was sent but empty or just spaces`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ username: '', password: 'somepassword' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('username').message);

        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: '           ', password: 'somepassword' });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('username').message);
    });

    test(`It should return 400 if the password was sent but empty or just spaces`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ username: 'test.purposes', password: '' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('password').message);

        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'test.purposes', password: '           ' });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('password').message);
    });

    test(`It should return 401 if the username doesn't exist`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ username: 'doesnt.exist', password: 'doesnt.exist' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new WrongCredentialsException().message);
    });

    test(`It should return 401 if the password is wrong`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ username: 'test.purposes', password: 'wrong.password' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new WrongCredentialsException().message);
    });
});

describe('GET /players', () => {
    test(`It should return 200 & all players info ordered by name ascending`, async () => {
        const res = await request(app).get(`${API_URL}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(Object.keys(res.body[0]).length).toBe(5);
        expect(res.body[0]).toHaveProperty('id_player');
        expect(res.body[0]).toHaveProperty('first_name');
        expect(res.body[0]).toHaveProperty('last_name');
        expect(res.body[0]).toHaveProperty('avatar');
        expect(res.body[0]).toHaveProperty('username');
        //check if its ordered by name ascending by comparing the full names of 2nd and 3rd players
        expect(`${res.body[1].first_name} ${res.body[1].last_name}` < `${res.body[2].first_name} ${res.body[2].last_name}`).toBeTruthy();
    });
});

describe('GET /players/:id', () => {
    test(`It should return 200 & player's with the given id info`, async () => {
        const res = await request(app).get(`${API_URL}/1`);

        expect(res.status).toBe(200);
        expect(Object.keys(res.body).length).toBe(5);
        expect(res.body).toHaveProperty('id_player');
        expect(res.body.id_player).toBe(1);
        expect(res.body).toHaveProperty('first_name');
        expect(res.body).toHaveProperty('last_name');
        expect(res.body).toHaveProperty('avatar');
        expect(res.body).toHaveProperty('username');
    });

    test(`It should return 404 if doesn't exist a player with the given id`, async () => {
        const res = await request(app).get(`${API_URL}/15555`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe(new IdNotFoundException('15555', 'jogador').message);
    });
});


describe('PUT /players/:id/password-reset', () => {
    test(`It should return 201 if successful`, async () => {
        const res = await request(app).put(`${API_URL}/61/password-reset`)
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(201);
        expect(Object.keys(res.body).length).toBe(0);
    });

    test(`It should return 403 if an ordinary player tries to reset another player password`, async () => {
        const res = await request(app).put(`${API_URL}/1/password-reset`)
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(new NotAuthorizedException().message);
    });

    test(`It should return 403 if the player tries to reset his own password 
(only admin is able to do it, in alternative the player can change the password)`, async () => {
        const res = await request(app).put(`${API_URL}/61/password-reset`)
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(new NotAuthorizedException().message);
    });

    test(`It should return 403 if an admin with read-only role tries to reset a password`, async () => {
        const res = await request(app).put(`${API_URL}/61/password-reset`)
            .set({ Authorization: 'Bearer ' + readOnlyAdminToken });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(new NotAuthorizedException().message);
    });

    test(`It should return 401 if an invalid token is sent`, async () => {
        const res = await request(app).put(`${API_URL}/61/password-reset`)
            .set({ Authorization: 'Bearer invalid.access.token' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);
    });

    test(`It should return 401 if no token is sent`, async () => {
        const res = await request(app).put(`${API_URL}/61/password-reset`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);
    });
});

describe('PUT /players/password-change', () => {
    const newPassword = 'newpassword';

    test(`It should return 201 & 200 on login with the new password`, async () => {
        const res = await request(app).put(`${API_URL}/password-change`)
            .send({ password: newPassword })
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res.status).toBe(201);
        expect(Object.keys(res.body).length).toBe(0);

        const login = await request(app).post(`${API_URL}/login`)
            .send({ username: 'test.purposes', password: newPassword });

        expect(login.status).toBe(200);
        expect(Object.keys(login.body).length).toBe(1);
        expect(login.body).toHaveProperty('accessToken');
    });

    test(`It should return 403 if an admin (no matter his role) tries to change a player password`, async () => {
        const res = await request(app).put(`${API_URL}/password-change`)
            .send({ password: newPassword })
            .set({ Authorization: 'Bearer ' + readOnlyAdminToken });

        const res2 = await request(app).put(`${API_URL}/password-change`)
            .send({ password: newPassword })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(new NotAuthorizedException().message);

        expect(res2.status).toBe(403);
        expect(res2.body.message).toBe(new NotAuthorizedException().message);
    });

    test(`It should return 401 if an invalid token is sent`, async () => {
        const res = await request(app).put(`${API_URL}/password-change`)
            .send({ password: newPassword })
            .set({ Authorization: 'Bearer invalid.access.token' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);
    });

    test(`It should return 401 if no token is sent`, async () => {
        const res = await request(app).put(`${API_URL}/password-change`)
            .send({ password: newPassword });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);
    });

    test(`It should return 400 if no password is sent`, async () => {
        const res = await request(app).put(`${API_URL}/password-change`)
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('password').message);
    });

    test(`It should return 400 if an empty or just spaces password is sent`, async () => {
        const res = await request(app).put(`${API_URL}/password-change`)
            .send({ password: '' })
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('password').message);

        const res2 = await request(app).put(`${API_URL}/password-change`)
            .send({ password: '                             ' })
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('password').message);
    });
});

afterAll(async () => {
    //reset test-purposes player password
    await request(app).put(`${API_URL}/61/password-reset`)
        .set({ Authorization: 'Bearer ' + superAdminToken });
    await pool.end();
});