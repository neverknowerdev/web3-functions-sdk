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
exports.Web3FunctionHttpClient = void 0;
// Use undici client as node@20.http has keepAlive errors
// See github issue: https://github.com/nodejs/node/issues/47130
const undici_1 = require("undici");
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));
class Web3FunctionHttpClient extends events_1.EventEmitter {
    constructor(host, port, mountPath, debug = true) {
        super();
        this._isStopped = false;
        this._host = host;
        this._port = port;
        this._debug = debug;
        this._mountPath = mountPath;
        this.on("input_event", this._safeSend.bind(this));
    }
    connect(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const retryInterval = 50;
            const end = perf_hooks_1.performance.now() + timeout;
            let statusOk = false;
            let lastErrMsg = "";
            let nbTries = 0;
            let connectTimeout = 1000;
            while (!statusOk && !this._isStopped && perf_hooks_1.performance.now() < end) {
                nbTries++;
                try {
                    const status = yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        const requestAbortController = new AbortController();
                        const timeoutId = setTimeout(() => {
                            connectTimeout += 100; // gradually increase the timeout for each retry
                            requestAbortController.abort();
                            reject(new Error(`Timeout after ${nbTries} tries`));
                        }, connectTimeout);
                        try {
                            const { statusCode } = yield (0, undici_1.request)(`${this._host}:${this._port}/${this._mountPath}`, {
                                dispatcher: new undici_1.Agent({ pipelining: 0 }),
                                signal: requestAbortController.signal,
                            });
                            resolve(statusCode);
                        }
                        catch (err) {
                            reject(err);
                        }
                        finally {
                            clearTimeout(timeoutId);
                        }
                    }));
                    statusOk = status === 200;
                    this._log(`Connected to Web3FunctionHttpServer socket!`);
                }
                catch (err) {
                    const errMsg = `${err.message} `;
                    lastErrMsg = errMsg;
                    yield delay(retryInterval);
                }
            }
            // Current instance has been stopped before we could connect
            if (this._isStopped)
                throw new Error(`Disconnected`);
            if (!statusOk) {
                throw new Error(`Web3FunctionHttpClient unable to connect (timeout=${timeout}ms): ${lastErrMsg}`);
            }
        });
    }
    _safeSend(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._send(event);
            }
            catch (error) {
                this.emit("error", error);
            }
        });
    }
    _send(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            let retry = 0;
            const maxRetry = 2;
            do {
                try {
                    const { body } = yield (0, undici_1.request)(`${this._host}:${this._port}/${this._mountPath}`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify(event),
                        dispatcher: new undici_1.Agent({ pipelining: 0 }),
                    });
                    res = body;
                }
                catch (err) {
                    const errMsg = err.toString();
                    if (retry >= maxRetry) {
                        throw new Error(`Web3FunctionHttpClient request error: ${errMsg}`);
                    }
                    else {
                        retry++;
                        this._log(`Web3FunctionHttpClient _send retry#${retry} request error: ${errMsg}`);
                        yield delay(100);
                    }
                }
            } while (!res);
            try {
                const event = (yield res.json());
                this._log(`Received Web3FunctionEvent: ${event.action}`);
                this.emit("output_event", event);
            }
            catch (err) {
                this._log(`Error parsing message: ${err.message}`);
                console.log(res.data);
                throw new Error(`Web3FunctionHttpClient response error: ${err.message}`);
            }
        });
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionHttpClient: ${message}`);
    }
    end() {
        if (!this._isStopped) {
            this._isStopped = true;
        }
    }
}
exports.Web3FunctionHttpClient = Web3FunctionHttpClient;
