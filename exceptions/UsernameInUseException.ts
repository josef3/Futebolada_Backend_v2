import HttpException from './HttpException';

class UsernameInUseException extends HttpException {
    constructor(username: string) {
        super(400, `O username ${username} já está a ser utilizado`);
    }
}

export default UsernameInUseException;