import jwt from 'jsonwebtoken';
import { IRequest, IResponse, INext } from '../interfaces';

export function authenticateToken(req: IRequest, res: IResponse, next: INext) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || '', (error, user) => {
        if (error) return res.sendStatus(401);

        if (user) {
            if (user.id_admin > 0) {
                req.isAdmin = true;
                req.id_admin = user.id_admin;
                req.admin_role = user.role;
            }
            else {
                req.isAdmin = false;
                req.id_player = user.id_player;
            }
        }
        next();
    });
};