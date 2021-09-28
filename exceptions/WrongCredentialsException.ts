import HttpException from './HttpException';

class WrongCredentialsException extends HttpException {
    constructor() {
        super(401, 'Credenciais erradas');
    }
}

export default WrongCredentialsException;