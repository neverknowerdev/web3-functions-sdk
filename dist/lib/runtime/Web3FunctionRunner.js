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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3FunctionRunner = void 0;
const address_1 = require("@ethersproject/address");
const crypto_1 = require("crypto");
const perf_hooks_1 = require("perf_hooks");
const signal_exit_1 = __importDefault(require("signal-exit"));
const Web3FunctionHttpClient_1 = require("../net/Web3FunctionHttpClient");
const Web3FunctionHttpProxy_1 = require("../net/Web3FunctionHttpProxy");
const Web3FunctionNetHelper_1 = require("../net/Web3FunctionNetHelper");
const Web3FunctionProxyProvider_1 = require("../provider/Web3FunctionProxyProvider");
const types_1 = require("../types");
const Web3FunctionDockerSandbox_1 = require("./sandbox/Web3FunctionDockerSandbox");
const Web3FunctionThreadSandbox_1 = require("./sandbox/Web3FunctionThreadSandbox");
const types_2 = require("./types");
const START_TIMEOUT = 5000;
const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));
class Web3FunctionRunner {
    constructor(debug = false, portsOccupied = []) {
        this._memory = 0;
        this._startupTime = 0;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this._exitRemover = () => { };
        this._debug = debug;
        this._portsOccupied = portsOccupied;
    }
    validateUserArgs(userArgsSchema, userArgs) {
        for (const key in userArgsSchema) {
            const value = userArgs[key];
            if (typeof value === "undefined") {
                throw new Error(`Web3FunctionSchemaError: Missing user arg '${key}'`);
            }
            const type = userArgsSchema[key];
            switch (type) {
                case "boolean":
                case "string":
                case "number":
                    if (typeof value !== type) {
                        throw new Error(`Web3FunctionSchemaError: Invalid ${type} value '${value.toString()}' for user arg '${key}'`);
                    }
                    break;
                case "boolean[]":
                case "string[]":
                case "number[]": {
                    const itemType = type.slice(0, -2);
                    if (!Array.isArray(value) ||
                        value.some((a) => typeof a !== itemType)) {
                        throw new Error(`Web3FunctionSchemaError: Invalid ${type} value '${value}' for user arg '${key}'`);
                    }
                    break;
                }
                default:
                    throw new Error(`Web3FunctionSchemaError: Unrecognized type '${type}' for user arg '${key}'`);
            }
        }
    }
    _getInvalidParseExample(type) {
        const useStr = (value) => `(use: '${value}')`;
        switch (type) {
            case "boolean":
                return useStr("true");
            case "boolean[]":
                return useStr("[true, false]");
            case "string":
                return useStr('"a"');
            case "string[]":
                return useStr('["a", "b"]');
            case "number":
                return useStr("1");
            case "number[]":
                return useStr("[1, 2]");
            default:
                return "";
        }
    }
    parseUserArgs(userArgsSchema, inputUserArgs) {
        const typedUserArgs = {};
        for (const key in userArgsSchema) {
            const value = inputUserArgs[key];
            if (typeof value === "undefined") {
                throw new Error(`Web3FunctionSchemaError: Missing user arg '${key}'`);
            }
            const type = userArgsSchema[key];
            const typing = type.split("[]");
            const baseType = typing[0];
            try {
                const parsedValue = JSON.parse(value);
                if ((typing.length > 1 &&
                    (!Array.isArray(parsedValue) ||
                        parsedValue.some((a) => typeof a !== baseType))) ||
                    (typing.length === 1 && typeof parsedValue !== baseType)) {
                    // array type
                    throw new Error(`Web3FunctionSchemaError: Invalid ${type} value '${value}' for user arg '${key}' ${this._getInvalidParseExample(type)}`);
                }
                typedUserArgs[key] = parsedValue;
            }
            catch (err) {
                throw new Error(`Parsing ${value} to ${type} failed. \n${err.message}`);
            }
        }
        return typedUserArgs;
    }
    run(operation, payload) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const start = perf_hooks_1.performance.now();
            const throttled = {};
            let result = undefined;
            let callbacks = {
                onSuccess: false,
                onFail: false,
            };
            let storage = undefined;
            let error = undefined;
            const { script, context, options, version, multiChainProviderConfig } = payload;
            try {
                const { data } = yield this._runInSandbox(script, version, operation, context, options, multiChainProviderConfig);
                if (operation === "onRun") {
                    this._validateResult(version, data.result);
                }
                result = data.result;
                if (data.callbacks) {
                    callbacks = data.callbacks;
                }
                storage = Object.assign(Object.assign({}, data.storage), { size: Buffer.byteLength(JSON.stringify(data.storage.storage), "utf-8") /
                        1024 });
            }
            catch (err) {
                error = err;
            }
            finally {
                yield this.stop();
            }
            const logs = (_b = (_a = this._sandbox) === null || _a === void 0 ? void 0 : _a.getLogs()) !== null && _b !== void 0 ? _b : [];
            const duration = (perf_hooks_1.performance.now() - start) / 1000;
            const memory = this._memory / 1024 / 1024;
            const startup = Number(this._startupTime.toFixed());
            const rpcCalls = (_d = (_c = this._proxyProvider) === null || _c === void 0 ? void 0 : _c.getNbRpcCalls()) !== null && _d !== void 0 ? _d : {
                total: 0,
                throttled: 0,
            };
            const networkStats = (_f = (_e = this._httpProxy) === null || _e === void 0 ? void 0 : _e.getStats()) !== null && _f !== void 0 ? _f : {
                nbRequests: 0,
                nbThrottled: 0,
                download: 0,
                upload: 0,
            };
            this._log(`Startup time=${startup}ms ${startup > 1000 ? "(SLOW)" : ""}`);
            this._log(`Runtime duration=${duration.toFixed(2)}s`);
            this._log(`Runtime memory=${memory.toFixed(2)}mb`);
            this._log(`Runtime rpc calls=${JSON.stringify(rpcCalls)}`);
            this._log(`Runtime storage size=${storage === null || storage === void 0 ? void 0 : storage.size.toFixed(2)}kb`);
            this._log(`Runtime network requests=${networkStats.nbRequests} (${networkStats.nbThrottled} throttled)`);
            this._log(`Runtime network download=${networkStats.download.toFixed(2)}kb`);
            this._log(`Runtime network upload=${networkStats.upload.toFixed(2)}kb`);
            if (networkStats.nbThrottled > 0) {
                throttled.networkRequest =
                    networkStats.nbRequests >= options.requestLimit;
                throttled.download =
                    networkStats.download >= options.downloadLimit / 1024;
                throttled.upload = networkStats.upload >= options.uploadLimit / 1024;
            }
            if (storage && (storage === null || storage === void 0 ? void 0 : storage.state) === "updated") {
                throttled.storage = storage.size > options.storageLimit;
            }
            if (storage) {
                const web3FunctionExec = {
                    success: true,
                    version,
                    callbacks,
                    storage,
                    logs,
                    duration,
                    memory,
                    rpcCalls,
                    network: networkStats,
                    throttled,
                };
                if (operation === "onRun") {
                    if (version == types_1.Web3FunctionVersion.V1_0_0) {
                        return Object.assign(Object.assign({}, web3FunctionExec), { version: types_1.Web3FunctionVersion.V1_0_0, result: result });
                    }
                    else {
                        return Object.assign(Object.assign({}, web3FunctionExec), { version: types_1.Web3FunctionVersion.V2_0_0, result: result });
                    }
                }
                else {
                    return Object.assign(Object.assign({}, web3FunctionExec), { result: undefined });
                }
            }
            else {
                if (error &&
                    error instanceof types_2.Web3FunctionRuntimeError &&
                    error.throttledReason) {
                    throttled[error.throttledReason] = true;
                }
                return {
                    success: false,
                    version,
                    error: error,
                    callbacks,
                    logs,
                    duration,
                    memory,
                    rpcCalls,
                    network: networkStats,
                    throttled,
                };
            }
        });
    }
    _createSandbox(runtime, memoryLimit, showLogs = false) {
        const SandBoxClass = runtime === "thread"
            ? Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox
            : Web3FunctionDockerSandbox_1.Web3FunctionDockerSandbox;
        return new SandBoxClass({
            memoryLimit: memoryLimit,
        }, showLogs, this._debug);
    }
    _getSandboxExitReason(runtime, signal, memoryLimit) {
        if (signal === 0) {
            return new Error(`Web3Function exited without returning result`);
        }
        else if (signal === 250) {
            return new types_2.Web3FunctionRuntimeError(`Web3Function exited with code=${signal} (RPC requests limit exceeded)`, "rpcRequest");
        }
        else if (signal === 251) {
            return new types_2.Web3FunctionRuntimeError(`Web3Function exited with code=${signal} (Unhandled promise rejection)`);
        }
        else if ((runtime === "docker" && signal === 137) ||
            (runtime === "thread" && signal === 133) ||
            (runtime === "thread" && this._memory / 1024 / 1024 >= memoryLimit)) {
            return new types_2.Web3FunctionRuntimeError(`Web3Function exited with code=${signal} (Memory limit exceeded)`, "memory");
        }
        else {
            return new Error(`Web3Function exited with code=${signal}`);
        }
    }
    _runInSandbox(script, version, operation, context, options, multiChainProviderConfig) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            this._sandbox = this._createSandbox(options.runtime, options.memory, options.showLogs);
            this._httpProxy = new Web3FunctionHttpProxy_1.Web3FunctionHttpProxy(options.downloadLimit, options.uploadLimit, options.requestLimit, this._debug);
            const httpProxyPort = (_a = options.httpProxyPort) !== null && _a !== void 0 ? _a : (yield Web3FunctionNetHelper_1.Web3FunctionNetHelper.getAvailablePort(this._portsOccupied));
            this._httpProxy.start(httpProxyPort);
            const mountPath = (0, crypto_1.randomUUID)();
            const serverPort = (_b = options.serverPort) !== null && _b !== void 0 ? _b : (yield Web3FunctionNetHelper_1.Web3FunctionNetHelper.getAvailablePort(this._portsOccupied));
            const start = perf_hooks_1.performance.now();
            try {
                this._log(`Starting sandbox: ${script}`);
                yield this._sandbox.start(script, version, serverPort, mountPath, httpProxyPort, options.blacklistedHosts);
            }
            catch (err) {
                this._log(`Fail to start Web3Function in sandbox ${err.message}`);
                throw new Error(`Web3Function failed to start sandbox: ${err.message}`);
            }
            // Attach process exit handler to clean runtime environment
            this._exitRemover = (0, signal_exit_1.default)(() => this.stop());
            // Proxy RPC provider
            this._proxyProvider = new Web3FunctionProxyProvider_1.Web3FunctionProxyProvider("http://127.0.0.1", options.rpcLimit, context.gelatoArgs.chainId, multiChainProviderConfig, this._debug);
            const rpcProxyPort = (_c = options.rpcProxyPort) !== null && _c !== void 0 ? _c : (yield Web3FunctionNetHelper_1.Web3FunctionNetHelper.getAvailablePort(this._portsOccupied));
            yield this._proxyProvider.start(rpcProxyPort);
            context.rpcProviderUrl = this._proxyProvider.getProxyUrl();
            // Override gelatoArgs according to schema version
            if (version === types_1.Web3FunctionVersion.V1_0_0) {
                context.gelatoArgs["blockTime"] = Math.floor(Date.now() / 1000);
            }
            // Start monitoring memory usage
            this._monitorMemoryUsage();
            this._client = new Web3FunctionHttpClient_1.Web3FunctionHttpClient("http://0.0.0.0", serverPort, mountPath, this._debug);
            try {
                yield Promise.race([
                    this._client.connect(START_TIMEOUT),
                    (_d = this._sandbox) === null || _d === void 0 ? void 0 : _d.waitForProcessEnd(),
                ]);
                this._startupTime = perf_hooks_1.performance.now() - start;
            }
            catch (err) {
                this._log(`Fail to connect to Web3Function ${err.message}`);
                throw new Error(`Web3Function start-up timeout (${START_TIMEOUT / 1000}s) \nMake sure you registered your onRun function correctly in your script.`);
            }
            return new Promise((resolve, reject) => {
                var _a, _b, _c, _d;
                let isResolved = false;
                (_a = this._client) === null || _a === void 0 ? void 0 : _a.emit("input_event", {
                    action: "start",
                    data: { operation, context },
                });
                (_b = this._client) === null || _b === void 0 ? void 0 : _b.on("error", (error) => __awaiter(this, void 0, void 0, function* () {
                    this._log(`Client error: ${error.message}`);
                    try {
                        yield this.stop();
                    }
                    catch (err) {
                        this._log(`Error stopping sandbox: ${err.message}`);
                    }
                }));
                (_c = this._client) === null || _c === void 0 ? void 0 : _c.on("output_event", (event) => {
                    this._log(`Received event: ${event.action}`);
                    switch (event.action) {
                        case "result":
                            isResolved = true;
                            resolve({ data: event.data });
                            break;
                        case "error":
                            isResolved = true;
                            reject(event.data.error);
                            break;
                        default:
                            this._log(`Unknown event: ${event.action}`);
                    }
                });
                // Stop waiting for result after timeout expire
                this._execTimeoutId = setTimeout(() => {
                    reject(new types_2.Web3FunctionRuntimeError(`Web3Function exceed execution timeout (${options.timeout / 1000}s)`, "duration"));
                }, options.timeout);
                // Listen to sandbox exit status code to detect runtime error
                (_d = this._sandbox) === null || _d === void 0 ? void 0 : _d.waitForProcessEnd().then((signal) => __awaiter(this, void 0, void 0, function* () {
                    // Wait for result event to be received if it's racing with process exit signal
                    if (!isResolved)
                        yield delay(100);
                    if (!isResolved) {
                        const reason = this._getSandboxExitReason(options.runtime, signal, options.memory);
                        reject(reason);
                    }
                }));
            });
        });
    }
    _monitorMemoryUsage() {
        this._memoryIntervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const liveMemory = yield ((_a = this._sandbox) === null || _a === void 0 ? void 0 : _a.getMemoryUsage());
                if (liveMemory && liveMemory > this._memory)
                    this._memory = liveMemory;
            }
            catch (err) {
                // Ignore
            }
        }), 100);
    }
    _throwError(message, result) {
        throw new Error(`Web3Function ${message}. Instead returned: ${JSON.stringify(result)}`);
    }
    _isValidData(data) {
        return data.length >= 10 && data.startsWith("0x", 0);
    }
    _validateResultV1(result) {
        if (result.canExec &&
            (!Object.keys(result).includes("callData") ||
                !this._isValidData(result.callData)))
            this._throwError("{canExec: bool, callData: string}", result);
    }
    _validateResultV2(result) {
        if (result.canExec) {
            if (!Object.keys(result).includes("callData") ||
                !Array.isArray(result.callData))
                this._throwError("must return {canExec: bool, callData: {to: string, data: string}[]}", result);
            for (const { to, data, value } of result.callData) {
                if (!(0, address_1.isAddress)(to))
                    this._throwError("returned invalid to address", result);
                if (!this._isValidData(data))
                    this._throwError("returned invalid callData", result);
                if (value) {
                    const isNumericString = /^\d+$/.test(value);
                    if (!isNumericString)
                        this._throwError("returned invalid value (must be numeric string)", result);
                }
            }
        }
    }
    _validateResult(version, result) {
        // validate canExec & callData exists
        if (!Object.keys(result).includes("canExec")) {
            this._throwError("must return {canExec: bool}", result);
        }
        // validate callData contents
        if (version === types_1.Web3FunctionVersion.V1_0_0) {
            result = result;
            this._validateResultV1(result);
        }
        else {
            result = result;
            this._validateResultV2(result);
        }
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this._log("Stopping runtime environment...");
            if (this._sandbox)
                yield this._sandbox.stop();
            if (this._client)
                this._client.end();
            if (this._proxyProvider)
                this._proxyProvider.stop();
            if (this._httpProxy)
                this._httpProxy.stop();
            if (this._execTimeoutId)
                clearTimeout(this._execTimeoutId);
            if (this._memoryIntervalId)
                clearInterval(this._memoryIntervalId);
            // Remove process exit handler
            this._exitRemover();
        });
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionRunner: ${message}`);
    }
}
exports.Web3FunctionRunner = Web3FunctionRunner;
