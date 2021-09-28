import { IRequest, IResponse, INext } from "../interfaces";

export const isSuperAdmin = (req: IRequest, res: IResponse, next: INext) => {
    if (req.admin_role !== 'admin') {
        return res.sendStatus(403);
    }
    next();
}