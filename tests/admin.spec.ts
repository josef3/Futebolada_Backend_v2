import request from 'supertest';

import app from '../app';
import { pool } from '../db_connection';

import EmptyFieldException from '../exceptions/EmptyFieldException';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import InvalidValueException from '../exceptions/InvalidValueException';
import UnauthorizedException from '../exceptions/UnauthorizedException';
import InvalidAuthTokenException from '../exceptions/InvalidAuthTokenException';
import UsernameInUseException from '../exceptions/UsernameInUseException';
import IdNotFoundException from '../exceptions/IdNotFoundException';

const API_URL = '/api/v2/admin';

let playerToken = '';
let superAdminToken = '';
let readOnlyAdminToken = '';

beforeAll(async () => {
    const { body: player } = await request(app).post(`/api/v2/players/login`)
        .send({ username: 'test.purposes', password: 'test.purposes' });
    playerToken = player.accessToken;

    const { body: superAdmin } = await request(app).post(`${API_URL}/login`)
        .send({ username: 'testsuperadmin', password: 'superadmin' });
    superAdminToken = superAdmin.accessToken;

    const { body: readOnlyAdmin } = await request(app).post(`${API_URL}/login`)
        .send({ username: 'testreadonly', password: 'readonly' });
    readOnlyAdminToken = readOnlyAdmin.accessToken;
});

describe('POST /admin/register', () => {
    test(`It should return 201 & access token & id`, async () => {
        //passing username, password and role
        const res = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'testreadonly2',
                password: 'readonly2',
                role: 'read-only'
            })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(201);
        expect(Object.keys(res.body).length).toBe(2);
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
        expect(res.body).toHaveProperty('id');
        expect(typeof res.body.id).toBe('number');

        //delete admin
        await request(app).delete(`${API_URL}/${res.body.id}`)
            .set({ Authorization: 'Bearer ' + superAdminToken });

        //passing just username and password
        const res2 = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'testreadonly3',
                password: 'readonly3',
            })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res2.status).toBe(201);
        expect(Object.keys(res2.body).length).toBe(2);
        expect(res2.body).toHaveProperty('accessToken');
        expect(typeof res2.body.accessToken).toBe('string');
        expect(res2.body).toHaveProperty('id');
        expect(typeof res2.body.id).toBe('number');

        //delete admin
        await request(app).delete(`${API_URL}/${res2.body.id}`)
            .set({ Authorization: 'Bearer ' + superAdminToken });
    });

    test(`It should return 400 if the username or password was not sent`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({ password: 'somepassword' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('username').message);

        const res2 = await request(app).post(`${API_URL}/register`)
            .send({ username: 'some.username' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('password').message);
    });

    test(`It should return 400 if the username was sent but empty or just spaces`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({ username: '', password: 'somepassword' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('username').message);

        const res2 = await request(app).post(`${API_URL}/register`)
            .send({ username: '           ', password: 'somepassword' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('username').message);
    });

    test(`It should return 400 if the password was sent but empty or just spaces`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({ username: 'testsuperadmin', password: '' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('password').message);

        const res2 = await request(app).post(`${API_URL}/register`)
            .send({ username: 'testsuperadmin', password: '           ' })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe(new EmptyFieldException('password').message);
    });

    test(`It should return 400 if the role parameter is invalid`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'some.username',
                password: 'some.password',
                role: 'invalid-role'
            })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new InvalidValueException('role').message);
    });

    test(`It should return 403 if a player or an admin with read-only permissions tries register an admin`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'some.username',
                password: 'some.password',
            })
            .set({ Authorization: 'Bearer ' + readOnlyAdminToken });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(new UnauthorizedException().message);

        const res2 = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'some.username',
                password: 'some.password',
            })
            .set({ Authorization: 'Bearer ' + playerToken });

        expect(res2.status).toBe(403);
        expect(res2.body.message).toBe(new UnauthorizedException().message);
    });

    test(`It should return 401 if an invalid or no token was sent`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'some.username',
                password: 'some.password',
            });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new InvalidAuthTokenException().message);

        const res2 = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'some.username',
                password: 'some.password',
            })
            .set({ Authorization: 'Bearer invalid.access.token' });

        expect(res2.status).toBe(401);
        expect(res2.body.message).toBe(new InvalidAuthTokenException().message);
    });

    test(`It should return 400 if the username already exists`, async () => {
        const res = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'testreadonly',
                password: 'somepassword'
            })
            .set({ Authorization: 'Bearer ' + superAdminToken })

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new UsernameInUseException('testreadonly').message);
    });
});

describe('POST /admin/login', () => {
    test(`It should return 200 & access token and username`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ username: 'testsuperadmin', password: 'superadmin' });

        expect(res.status).toBe(200);
        expect(Object.keys(res.body).length).toBe(2);
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
        expect(res.body).toHaveProperty('username');
        expect(typeof res.body.username).toBe('string');


        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'testreadonly', password: 'readonly' });

        expect(res2.status).toBe(200);
        expect(Object.keys(res2.body).length).toBe(2);
        expect(res2.body).toHaveProperty('accessToken');
        expect(typeof res2.body.accessToken).toBe('string');
        expect(res2.body).toHaveProperty('username');
        expect(typeof res2.body.username).toBe('string');

        //username verification should not be case sensitive
        const res3 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'TesTReadOnly', password: 'readonly' });

        expect(res3.status).toBe(200);
        expect(Object.keys(res3.body).length).toBe(2);
        expect(res3.body).toHaveProperty('accessToken');
        expect(typeof res3.body.accessToken).toBe('string');
        expect(res3.body).toHaveProperty('username');
        expect(typeof res3.body.username).toBe('string');
    });

    test(`It should return 400 if the username or password was not sent`, async () => {
        const res = await request(app).post(`${API_URL}/login`)
            .send({ password: 'somepassword' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('username').message);

        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'some.username' });

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
            .send({ username: 'testsuperadmin', password: '' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(new EmptyFieldException('password').message);

        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'testsuperadmin', password: '           ' });

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
            .send({ username: 'testreadonly', password: 'wrong_password' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(new WrongCredentialsException().message);

        //password verification should not be case sensitive
        const res2 = await request(app).post(`${API_URL}/login`)
            .send({ username: 'testreadonly', password: 'Readonly' });

        expect(res2.status).toBe(401);
        expect(res2.body.message).toBe(new WrongCredentialsException().message);
    });
});

describe('DELETE /admin/:id', () => {
    test('It should return 204 if successful', async () => {
        //create an admin
        const newAdmin = await request(app).post(`${API_URL}/register`)
            .send({
                username: 'testreadonly2',
                password: 'readonly2',
                role: 'read-only'
            })
            .set({ Authorization: 'Bearer ' + superAdminToken });

        const res = await request(app).delete(`${API_URL}/${newAdmin.body.id}`)
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(204);
    });

    test('It should return 404 if successful', async () => {
        const id = 123456;
        const res = await request(app).delete(`${API_URL}/${id}`)
            .set({ Authorization: 'Bearer ' + superAdminToken });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe(new IdNotFoundException(id, 'admin').message);
    });
});

afterAll(async () => {
    await pool.end();
});