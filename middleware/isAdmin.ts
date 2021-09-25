import { IRequest, IResponse, INext } from "../interfaces";

export const isAdmin = (req: IRequest, res: IResponse, next: INext) => {
    if (req.isAdmin !== true) {
        return res.sendStatus(403);
    }
    next();
}