import { IRequest, IResponse, INext } from "../interfaces";
import UnauthorizedException from '../exceptions/UnauthorizedException';

export const isSuperAdmin = (req: IRequest, res: IResponse, next: INext) => {
    if (req.admin_role !== 'admin') {
        return next(new UnauthorizedException());
    }
    next();
}