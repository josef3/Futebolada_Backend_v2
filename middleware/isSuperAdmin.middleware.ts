import { IRequest, IResponse, INext } from "../interfaces";
import NotAuthorizedException from '../exceptions/NotAuthorizedException';

export const isSuperAdmin = (req: IRequest, res: IResponse, next: INext) => {
    if (req.admin_role !== 'admin') {
        return next(new NotAuthorizedException());
    }
    next();
}