import HttpException from './HttpException';

class PlayerIdNotFoundException extends HttpException {
    constructor(id: string) {
        super(404, `O jogador com o id ${id} não existe`);
    }
}

export default PlayerIdNotFoundException;