"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3FunctionRuntimeError = void 0;
class Web3FunctionRuntimeError extends Error {
    constructor(message, throttledReason) {
        super(message);
        this.throttledReason = throttledReason;
    }
}
exports.Web3FunctionRuntimeError = Web3FunctionRuntimeError;
