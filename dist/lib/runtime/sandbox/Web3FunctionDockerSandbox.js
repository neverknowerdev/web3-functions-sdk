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
exports.Web3FunctionDockerSandbox = void 0;
/* eslint-disable no-empty */
const dockerode_1 = __importDefault(require("dockerode"));
const path_1 = __importDefault(require("path"));
const types_1 = require("../../types");
const Web3FunctionAbstractSandbox_1 = require("./Web3FunctionAbstractSandbox");
const HTTP_PROXY_HOST = "host.docker.internal";
class Web3FunctionDockerSandbox extends Web3FunctionAbstractSandbox_1.Web3FunctionAbstractSandbox {
    constructor() {
        super(...arguments);
        this._docker = new dockerode_1.default();
        this._denoImage = "denoland/deno:alpine-1.36.0";
    }
    _stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._container)
                return;
            try {
                yield this._container.kill({
                    signal: "SIGKILL",
                });
            }
            catch (err) { }
            try {
                yield this._container.remove();
            }
            catch (err) { }
        });
    }
    _createImageIfMissing(image) {
        return __awaiter(this, void 0, void 0, function* () {
            let images = [];
            try {
                images = yield this._docker.listImages({
                    filters: JSON.stringify({ reference: [image] }),
                });
            }
            catch (err) { }
            if (images.length === 0) {
                this._log(`Creating docker image: ${image}`);
                const created = yield this._docker.createImage({ fromImage: image });
                yield new Promise((resolve) => {
                    created.on("data", (raw) => {
                        const lines = raw.toString().split("\r\n");
                        lines.forEach((line) => {
                            var _a;
                            if (line === "")
                                return;
                            const data = JSON.parse(line);
                            this._log(`${data.status} ${(_a = data.progress) !== null && _a !== void 0 ? _a : ""}`);
                        });
                    });
                    created.once("end", resolve);
                });
                this._log(`Docker image created!`);
            }
        });
    }
    _start(script, version, serverPort, mountPath, httpProxyPort, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { dir, name, ext } = path_1.default.parse(script);
            const scriptName = `${name}${ext}`;
            const cmd = `deno`;
            let env = [];
            if (version === types_1.Web3FunctionVersion.V1_0_0) {
                env = [`WEB3_FUNCTION_SERVER_PORT=${serverPort.toString()}`];
            }
            else {
                env = [
                    `WEB3_FUNCTION_SERVER_PORT=${serverPort.toString()}`,
                    `WEB3_FUNCTION_MOUNT_PATH=${mountPath}`,
                ];
            }
            const httpProxyUrl = `${HTTP_PROXY_HOST}:${httpProxyPort}`;
            env.push(`HTTP_PROXY=${httpProxyUrl}`);
            env.push(`HTTPS_PROXY=${httpProxyUrl}`);
            args.push(`/web3Function/${scriptName}`);
            // See docker create options:
            // https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerCreate
            const createOptions = {
                ExposedPorts: {
                    [`${serverPort.toString()}/tcp`]: {},
                },
                Env: env,
                Hostconfig: {
                    Binds: [`${dir}:/web3Function/`],
                    PortBindings: {
                        [`${serverPort.toString()}/tcp`]: [
                            { HostPort: `${serverPort.toString()}` },
                        ],
                    },
                    NetworkMode: "bridge",
                    Memory: this._memoryLimit * 1024 * 1024,
                },
                Tty: true,
                //StopTimeout: 10,
                Cmd: [cmd, ...args],
                Image: this._denoImage,
            };
            let processExitCodeFunction;
            this._processExitCodePromise = new Promise((resolve) => {
                processExitCodeFunction = resolve;
            });
            yield this._createImageIfMissing(this._denoImage);
            this._container = yield this._docker.createContainer(createOptions);
            const containerStream = yield this._container.attach({
                stream: true,
                stdout: true,
                stderr: true,
            });
            containerStream.setEncoding("utf8");
            containerStream.on("data", this._onStdoutData.bind(this));
            containerStream.on("end", () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Container has stopped
                    const status = yield ((_a = this._container) === null || _a === void 0 ? void 0 : _a.wait());
                    processExitCodeFunction(status.StatusCode);
                    this._log(`Container exited with code=${status.StatusCode}`);
                }
                catch (err) {
                    processExitCodeFunction(1);
                    this._log(`Unable to get container exit code, error: ${err.message}`);
                }
            }));
            yield this._container.start({});
        });
    }
    _getMemoryUsage() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield ((_a = this._container) === null || _a === void 0 ? void 0 : _a.stats({ stream: false }));
            return (_b = stats === null || stats === void 0 ? void 0 : stats.memory_stats.usage) !== null && _b !== void 0 ? _b : 0;
        });
    }
}
exports.Web3FunctionDockerSandbox = Web3FunctionDockerSandbox;
