"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3FunctionRunnerPool = void 0;
const Web3FunctionNetHelper_1 = require("../net/Web3FunctionNetHelper");
const Web3FunctionRunner_1 = require("./Web3FunctionRunner");
class Web3FunctionRunnerPool {
    constructor(poolSize = 10, debug = true) {
        this._queuedRunners = [];
        this._activeRunners = 0;
        this._tcpPortsAvailable = [];
        this._poolSize = poolSize;
        this._debug = debug;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._tcpPortsAvailable = yield Web3FunctionNetHelper_1.Web3FunctionNetHelper.getAvailablePorts((this._poolSize + 5) * 3 // 3 ports per concurrent runner + 5 extra
            );
        });
    }
    run(operation, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._enqueueAndWait(operation, payload);
        });
    }
    _enqueueAndWait(operation, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this._queuedRunners.push(() => __awaiter(this, void 0, void 0, function* () {
                    this._activeRunners = this._activeRunners + 1;
                    const port1 = this._tcpPortsAvailable.shift();
                    const port2 = this._tcpPortsAvailable.shift();
                    const port3 = this._tcpPortsAvailable.shift();
                    try {
                        this._log(`Starting Web3FunctionRunner, active=${this._activeRunners} ports=${port1},${port2},${port3}`);
                        const runner = new Web3FunctionRunner_1.Web3FunctionRunner(this._debug, this._tcpPortsAvailable);
                        payload.options.serverPort = port1;
                        payload.options.httpProxyPort = port2;
                        payload.options.rpcProxyPort = port3;
                        const exec = yield runner.run(operation, payload);
                        resolve(exec);
                    }
                    catch (err) {
                        reject(err);
                    }
                    finally {
                        if (port1)
                            this._tcpPortsAvailable.push(port1);
                        if (port2)
                            this._tcpPortsAvailable.push(port2);
                        if (port3)
                            this._tcpPortsAvailable.push(port3);
                        this._activeRunners = this._activeRunners - 1;
                    }
                }));
                if (this._activeRunners < this._poolSize) {
                    this._processNext();
                }
            });
        });
    }
    _processNext() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let runner = this._queuedRunners.shift(); runner; runner = this._queuedRunners.shift()) {
                this._log(`_processNext, active=${this._activeRunners}`);
                yield runner();
            }
        });
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionRunnerPool: ${message}`);
    }
}
exports.Web3FunctionRunnerPool = Web3FunctionRunnerPool;
