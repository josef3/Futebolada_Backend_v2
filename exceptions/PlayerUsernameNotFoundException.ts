import HttpException from './HttpException';

class PlayerUsernameNotFoundException extends HttpException {
    constructor(username: string) {
        super(404, `O jogador com o username ${username} não existe`);
    }
}

export default PlayerUsernameNotFoundException;