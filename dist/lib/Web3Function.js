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
exports.Web3Function = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const deep_object_diff_1 = require("deep-object-diff");
const Web3FunctionHttpServer_1 = require("./net/Web3FunctionHttpServer");
const Web3FunctionMultiChainProvider_1 = require("./provider/Web3FunctionMultiChainProvider");
class Web3Function {
    constructor() {
        var _a;
        // Register global Unhandled Promise rejection catching
        globalThis.addEventListener("unhandledrejection", (e) => {
            console.log("Unhandled promise rejection at:", e.promise);
            this._exit(251, true);
        });
        const port = Number((_a = Deno.env.get("WEB3_FUNCTION_SERVER_PORT")) !== null && _a !== void 0 ? _a : 80);
        const mountPath = Deno.env.get("WEB3_FUNCTION_MOUNT_PATH");
        this._server = new Web3FunctionHttpServer_1.Web3FunctionHttpServer(port, mountPath, Web3Function._debug, this._onFunctionEvent.bind(this));
    }
    _onFunctionEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((event === null || event === void 0 ? void 0 : event.action) === "start") {
                const prevStorage = Object.assign({}, event.data.context.storage);
                try {
                    const { result, ctxData } = event.data.operation === "onSuccess"
                        ? yield this._invokeOnSuccess(event.data.context)
                        : event.data.operation === "onFail"
                            ? yield this._invokeOnFail(event.data.context)
                            : yield this._invokeOnRun(event.data.context);
                    const { difference, state } = this._compareStorage(prevStorage, ctxData.storage);
                    return {
                        action: "result",
                        data: {
                            result,
                            storage: {
                                state,
                                storage: ctxData.storage,
                                diff: difference,
                            },
                            callbacks: {
                                onFail: this._onFail !== undefined,
                                onSuccess: this._onSuccess !== undefined,
                            },
                        },
                    };
                }
                catch (error) {
                    return {
                        action: "error",
                        data: {
                            error: {
                                name: error.name,
                                message: `${error.name}: ${error.message}`,
                            },
                            storage: {
                                state: "last",
                                storage: prevStorage,
                                diff: {},
                            },
                            callbacks: {
                                onFail: this._onFail !== undefined,
                                onSuccess: this._onSuccess !== undefined,
                            },
                        },
                    };
                }
                finally {
                    this._exit();
                }
            }
            else {
                Web3Function._log(`Unrecognized parent process event: ${event.action}`);
                throw new Error(`Unrecognized parent process event: ${event.action}`);
            }
        });
    }
    _invokeOnRun(ctxData) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this._context(ctxData);
            if (!this._onRun)
                throw new Error("Web3Function.onRun function is not registered");
            const result = ctxData.log
                ? yield this._onRun(Object.assign(Object.assign({}, context), { log: ctxData.log }))
                : yield this._onRun(context);
            return { result, ctxData };
        });
    }
    _invokeOnFail(ctxData) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this._context(ctxData);
            if (!this._onFail)
                throw new Error("Web3Function.onFail function is not registered");
            if (ctxData.onFailReason === "SimulationFailed") {
                yield this._onFail(Object.assign(Object.assign({}, context), { reason: ctxData.onFailReason, callData: ctxData.callData }));
            }
            else if (ctxData.onFailReason === "ExecutionReverted") {
                yield this._onFail(Object.assign(Object.assign({}, context), { reason: ctxData.onFailReason, transactionHash: ctxData.transactionHash }));
            }
            else if (ctxData.onFailReason === "InsufficientFunds") {
                yield this._onFail(Object.assign(Object.assign({}, context), { reason: ctxData.onFailReason }));
            }
            return {
                result: undefined,
                ctxData,
            };
        });
    }
    _invokeOnSuccess(ctxData) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this._context(ctxData);
            if (!this._onSuccess)
                throw new Error("Web3Function.onSuccess function is not registered");
            yield this._onSuccess(Object.assign(Object.assign({}, context), { transactionHash: ctxData.transactionHash }));
            return {
                result: undefined,
                ctxData,
            };
        });
    }
    _context(ctxData) {
        const context = {
            gelatoArgs: Object.assign(Object.assign({}, ctxData.gelatoArgs), { gasPrice: bignumber_1.BigNumber.from(ctxData.gelatoArgs.gasPrice) }),
            multiChainProvider: this._initProvider(ctxData.rpcProviderUrl, ctxData.gelatoArgs.chainId),
            userArgs: ctxData.userArgs,
            secrets: {
                get: (key) => __awaiter(this, void 0, void 0, function* () {
                    Web3Function._log(`secrets.get(${key})`);
                    return ctxData.secrets[key];
                }),
            },
            storage: {
                get: (key) => __awaiter(this, void 0, void 0, function* () {
                    Web3Function._log(`storage.get(${key})`);
                    return ctxData.storage[key];
                }),
                set: (key, value) => __awaiter(this, void 0, void 0, function* () {
                    if (typeof value !== "string") {
                        throw new Error("Web3FunctionStorageError: value must be a string");
                    }
                    Web3Function._log(`storage.set(${key},${value})`);
                    ctxData.storage[key] = value;
                }),
                delete: (key) => __awaiter(this, void 0, void 0, function* () {
                    Web3Function._log(`storage.delete(${key})`);
                    ctxData.storage[key] = undefined;
                }),
                getKeys: () => __awaiter(this, void 0, void 0, function* () {
                    Web3Function._log(`storage.getKeys()`);
                    return Object.keys(ctxData.storage);
                }),
                getSize: () => __awaiter(this, void 0, void 0, function* () {
                    Web3Function._log(`storage.getSize()`);
                    var enc = new TextEncoder();
                    return enc.encode(JSON.stringify(ctxData.storage)).length;
                }),
            },
        };
        return context;
    }
    _compareStorage(prevStorage, afterStorage) {
        const difference = (0, deep_object_diff_1.diff)(prevStorage, afterStorage);
        for (const key in difference) {
            if (difference[key] === undefined) {
                difference[key] = null;
            }
        }
        const state = Object.keys(difference).length === 0 ? "last" : "updated";
        return { difference, state };
    }
    _exit(code = 0, force = false) {
        if (force) {
            Deno.exit(code);
        }
        else {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield this._server.waitConnectionReleased();
                Deno.exit(code);
            }));
        }
    }
    static getInstance() {
        if (!Web3Function.Instance) {
            Web3Function.Instance = new Web3Function();
        }
        return Web3Function.Instance;
    }
    static onRun(onRun) {
        Web3Function._log("Registering onRun function");
        Web3Function.getInstance()._onRun = onRun;
    }
    static onSuccess(onSuccess) {
        Web3Function._log("Registering onSuccess function");
        Web3Function.getInstance()._onSuccess = onSuccess;
    }
    static onFail(onFail) {
        Web3Function._log("Registering onFail function");
        Web3Function.getInstance()._onFail = onFail;
    }
    static setDebug(debug) {
        Web3Function._debug = debug;
    }
    static _log(message) {
        if (Web3Function._debug)
            console.log(`Web3Function: ${message}`);
    }
    _onRpcRateLimit() {
        console.log("_onRpcRateLimit");
        this._exit(250, true);
    }
    _initProvider(providerUrl, defaultChainId) {
        if (!providerUrl)
            throw new Error("Missing providerUrl");
        return new Web3FunctionMultiChainProvider_1.Web3FunctionMultiChainProvider(providerUrl, defaultChainId, this._onRpcRateLimit.bind(this));
    }
}
exports.Web3Function = Web3Function;
Web3Function._debug = false;
