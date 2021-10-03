import HttpException from './HttpException';

class UnauthorizedException extends HttpException {
    constructor() {
        super(403, 'Sem autorização para aceder a este recurso');
    }
}

export default UnauthorizedException;