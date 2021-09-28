import HttpException from './HttpException';

class NotAuthorizedException extends HttpException {
    constructor() {
        super(403, 'Sem autorização para aceder a este recurso');
    }
}

export default NotAuthorizedException;