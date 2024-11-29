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
exports.Web3FunctionHardhat = exports.W3fHardhatPlugin = void 0;
const builder_1 = require("../../lib/builder");
const loader_1 = require("../../lib/loader");
const runtime_1 = require("../../lib/runtime");
const constants_1 = require("../constants");
const provider_1 = require("../provider");
class W3fHardhatPlugin {
    constructor(_hre) {
        this.hre = _hre;
    }
    get(_name) {
        const w3f = loader_1.Web3FunctionLoader.load(_name, this.hre.config.w3f.rootDir);
        return new Web3FunctionHardhat(this.hre, w3f);
    }
}
exports.W3fHardhatPlugin = W3fHardhatPlugin;
class Web3FunctionHardhat {
    constructor(_hre, _w3f) {
        this.w3f = _w3f;
        this.hre = _hre;
        this.provider = new provider_1.EthersProviderWrapper(_hre.network.provider);
    }
    run(operation, override) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const userArgs = (_a = override === null || override === void 0 ? void 0 : override.userArgs) !== null && _a !== void 0 ? _a : this.w3f.userArgs;
            const storage = (_b = override === null || override === void 0 ? void 0 : override.storage) !== null && _b !== void 0 ? _b : this.w3f.storage;
            const secrets = this.w3f.secrets;
            const debug = this.hre.config.w3f.debug;
            const log = (_c = override === null || override === void 0 ? void 0 : override.log) !== null && _c !== void 0 ? _c : this.w3f.log;
            const buildRes = yield builder_1.Web3FunctionBuilder.build(this.w3f.path, { debug });
            if (!buildRes.success)
                throw new Error(`Fail to build web3Function: ${buildRes.error}`);
            const runner = new runtime_1.Web3FunctionRunner(debug);
            runner.validateUserArgs(buildRes.schema.userArgs, userArgs);
            const web3FunctionVersion = buildRes.schema.web3FunctionVersion;
            const runtime = "thread";
            const memory = buildRes.schema.memory;
            const timeout = buildRes.schema.timeout * 1000;
            const version = buildRes.schema.web3FunctionVersion;
            const options = {
                runtime,
                showLogs: true,
                memory,
                rpcLimit: constants_1.MAX_RPC_LIMIT,
                timeout,
                downloadLimit: constants_1.MAX_DOWNLOAD_LIMIT,
                uploadLimit: constants_1.MAX_UPLOAD_LIMIT,
                requestLimit: constants_1.MAX_REQUEST_LIMIT,
                storageLimit: constants_1.MAX_STORAGE_LIMIT,
                web3FunctionVersion,
            };
            const script = buildRes.filePath;
            const gelatoArgs = yield this.getGelatoArgs();
            const baseContext = {
                gelatoArgs,
                userArgs,
                secrets,
                storage,
                log,
            };
            let context;
            if (operation === "onFail") {
                //Todo: accept arguments
                context = Object.assign(Object.assign({}, baseContext), { onFailReason: "SimulationFailed", callData: [
                        {
                            to: "0x0000000000000000000000000000000000000000",
                            data: "0x00000000",
                        },
                    ] });
            }
            else if (operation === "onSuccess") {
                context = Object.assign({}, baseContext);
            }
            else {
                context = Object.assign({}, baseContext);
            }
            const multiChainProviderConfig = yield (0, provider_1.getMultiChainProviderConfigs)(this.hre);
            const res = yield runner.run(operation, {
                script,
                context,
                options,
                version,
                multiChainProviderConfig,
            });
            if (!res.success)
                throw new Error(`Fail to run web3 function: ${res.error.message}`);
            return res;
        });
    }
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            const cid = yield builder_1.Web3FunctionBuilder.deploy(this.w3f.path);
            return cid;
        });
    }
    getGelatoArgs(gasPriceOverride) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const block = yield this.provider.getBlock("latest");
            const blockTime = block.timestamp;
            const chainId = (_a = this.hre.network.config.chainId) !== null && _a !== void 0 ? _a : (yield this.provider.getNetwork()).chainId;
            const gasPrice = gasPriceOverride !== null && gasPriceOverride !== void 0 ? gasPriceOverride : (yield this.provider.getGasPrice()).toString();
            return { blockTime, chainId, gasPrice };
        });
    }
    getSecrets() {
        return this.w3f.secrets;
    }
    getUserArgs() {
        return this.w3f.userArgs;
    }
    getStorage() {
        return this.w3f.storage;
    }
    getPath() {
        return this.w3f.path;
    }
}
exports.Web3FunctionHardhat = Web3FunctionHardhat;
