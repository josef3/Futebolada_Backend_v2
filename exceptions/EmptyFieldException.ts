import HttpException from './HttpException';

class EmptyFieldException extends HttpException {
    constructor(fieldName: string) {
        super(400, `O campo ${fieldName} não pode estar vazio`);
    }
}

export default EmptyFieldException;