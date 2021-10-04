import HttpException from './HttpException';

class InvalidValueException extends HttpException {
    constructor(fieldName: string) {
        super(400, `O parâmetro ${fieldName} é inválido`);
    }
}

export default InvalidValueException;