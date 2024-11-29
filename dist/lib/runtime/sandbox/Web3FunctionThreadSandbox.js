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
exports.Web3FunctionThreadSandbox = void 0;
/* eslint-disable no-empty */
const node_child_process_1 = require("node:child_process");
const path_1 = __importDefault(require("path"));
const pidusage_1 = __importDefault(require("pidusage"));
const types_1 = require("../../types");
const Web3FunctionAbstractSandbox_1 = require("./Web3FunctionAbstractSandbox");
const HTTP_PROXY_HOST = "127.0.0.1";
class Web3FunctionThreadSandbox extends Web3FunctionAbstractSandbox_1.Web3FunctionAbstractSandbox {
    _stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._thread)
                return;
            this._thread.kill("SIGKILL");
        });
    }
    _start(script, version, serverPort, mountPath, httpProxyPort, args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = (_a = process.env.DENO_PATH) !== null && _a !== void 0 ? _a : path_1.default.join(process.cwd(), "node_modules", "deno-bin", "bin", "deno");
            let env = {};
            if (version === types_1.Web3FunctionVersion.V1_0_0) {
                env = { WEB3_FUNCTION_SERVER_PORT: serverPort.toString() };
            }
            else {
                env = {
                    WEB3_FUNCTION_SERVER_PORT: serverPort.toString(),
                    WEB3_FUNCTION_MOUNT_PATH: mountPath,
                };
            }
            const httpProxyUrl = `${HTTP_PROXY_HOST}:${httpProxyPort}`;
            env["HTTP_PROXY"] = httpProxyUrl;
            env["HTTPS_PROXY"] = httpProxyUrl;
            args.push(script);
            this._thread = (0, node_child_process_1.spawn)(cmd, args, {
                shell: true,
                cwd: process.cwd(),
                env,
            });
            let processExitCodeFunction;
            this._processExitCodePromise = new Promise((resolve) => {
                processExitCodeFunction = resolve;
            });
            this._thread.on("close", (code, signal) => {
                this._log(`Thread exited with code=${code} signal=${signal}`);
                processExitCodeFunction(code);
            });
            this._thread.stdout.on("data", this._onStdoutData.bind(this));
            this._thread.stderr.on("data", this._onStdoutData.bind(this));
        });
    }
    _getMemoryUsage() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield (0, pidusage_1.default)((_a = this._thread) === null || _a === void 0 ? void 0 : _a.pid);
            return stats === null || stats === void 0 ? void 0 : stats.memory;
        });
    }
}
exports.Web3FunctionThreadSandbox = Web3FunctionThreadSandbox;
