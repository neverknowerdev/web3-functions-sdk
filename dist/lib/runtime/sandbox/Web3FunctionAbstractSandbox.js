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
exports.Web3FunctionAbstractSandbox = void 0;
const safe_1 = __importDefault(require("colors/safe"));
const events_1 = require("events");
const types_1 = require("../../types");
class Web3FunctionAbstractSandbox extends events_1.EventEmitter {
    constructor(options, showStdout = true, debug = true) {
        super();
        this._isStopped = false;
        this._processExitCodePromise = Promise.resolve(0);
        this._logs = [];
        this._memoryLimit = options.memoryLimit;
        this._showStdout = showStdout;
        this._debug = debug;
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._isStopped) {
                this._isStopped = true;
                yield this._stop();
            }
        });
    }
    start(script, version, serverPort, mountPath, httpProxyPort, blacklistedHosts) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = [];
            this._log("Starting sandbox");
            // Prepare common base args here
            args.push("run");
            if (version === types_1.Web3FunctionVersion.V1_0_0) {
                args.push(`--allow-env=WEB3_FUNCTION_SERVER_PORT`);
                args.push(`--unstable`);
            }
            else {
                args.push(`--allow-env=WEB3_FUNCTION_SERVER_PORT,WEB3_FUNCTION_MOUNT_PATH`);
            }
            args.push(`--allow-net`);
            if (blacklistedHosts && blacklistedHosts.length > 0) {
                args.push(`--deny-net=${blacklistedHosts === null || blacklistedHosts === void 0 ? void 0 : blacklistedHosts.toString()}`);
            }
            args.push(`--no-prompt`);
            args.push(`--no-npm`);
            args.push(`--no-remote`);
            args.push(`--v8-flags=--max-old-space-size=${this._memoryLimit}`);
            yield this._start(script, version, serverPort, mountPath, httpProxyPort, args);
        });
    }
    getMemoryUsage() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (_a = (yield this._getMemoryUsage())) !== null && _a !== void 0 ? _a : 0;
            }
            catch (err) {
                return 0;
            }
        });
    }
    getLogs() {
        return this._logs;
    }
    _onStdoutData(data) {
        const output = data.toString();
        output
            .split("\n")
            .filter((line) => line !== "")
            .forEach((line) => {
            this._logs.push(line);
            if (this._showStdout)
                console.log(safe_1.default.cyan(`>`), safe_1.default.grey(`${line}`));
        });
    }
    waitForProcessEnd() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._processExitCodePromise;
        });
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionSandbox: ${message}`);
    }
}
exports.Web3FunctionAbstractSandbox = Web3FunctionAbstractSandbox;
