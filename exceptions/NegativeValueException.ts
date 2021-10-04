import HttpException from './HttpException';

class NegativeValueException extends HttpException {
    constructor(fieldName: string) {
        super(400, `O campo ${fieldName} não pode ser negativo`);
    }
}

export default NegativeValueException;