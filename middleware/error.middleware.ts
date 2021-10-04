import { INext, IRequest, IResponse } from '../interfaces';
import HttpException from '../exceptions/HttpException';

function errorMiddleware(error: HttpException, req: IRequest, res: IResponse, next: INext) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Algo inesperado ocorreu, por favor tenta mais tarde';

    res.status(statusCode).send({ message });
}

export default errorMiddleware;