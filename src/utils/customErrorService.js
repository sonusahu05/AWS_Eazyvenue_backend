class CustomErrorService extends Error {
    constructor(message, metadata = {}) {
        super();
        Error.captureStackTrace(this, this.constructor);
            this.message = message;
            this.metadata = metadata;
    }
}
module.exports = CustomErrorService;