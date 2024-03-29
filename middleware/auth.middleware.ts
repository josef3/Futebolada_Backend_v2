import jwt from 'jsonwebtoken';
import InvalidAuthTokenException from '../exceptions/InvalidAuthTokenException';
import { IRequest, IResponse, INext } from '../interfaces';

export function authenticateToken(req: IRequest, res: IResponse, next: INext) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next(new InvalidAuthTokenException());
    }

    jwt.verify(token, String(process.env.ACCESS_TOKEN_SECRET), (error, user) => {
        if (error) {
            return next(new InvalidAuthTokenException());
        }

        if (user) {
            if (user.id_admin > 0) {
                req.id_admin = user.id_admin;
                req.admin_role = user.role;
            }
            else {
                req.id_player = user.id_player;
            }
        }
        next();
    });
};