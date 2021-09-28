import HttpException from './HttpException';

class InvalidAuthTokenException extends HttpException {
    constructor() {
        super(401, 'Token de autenticação inválido');
    }
}

export default InvalidAuthTokenException;