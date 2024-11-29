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
exports.Web3FunctionProxyProvider = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const crypto_1 = __importDefault(require("crypto"));
const eth_rpc_errors_1 = require("eth-rpc-errors");
const express_1 = __importDefault(require("express"));
class Web3FunctionProxyProvider {
    constructor(host, limit, mainChainId, multiChainProviderConfig, debug = true) {
        this._app = (0, express_1.default)();
        this._isStopped = false;
        this._nbRpcCalls = 0;
        this._nbThrottledRpcCalls = 0;
        this._whitelistedMethods = ["eth_chainId", "net_version"];
        this._mainChainId = mainChainId;
        this._host = host;
        this._debug = debug;
        this._limit = limit;
        this._mountPath = crypto_1.default.randomUUID();
        this._providers = new Map();
        this._instantiateProvider(multiChainProviderConfig);
    }
    _checkRateLimit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._nbRpcCalls > this._limit) {
                // Reject requests when reaching hard limit
                this._log(`Too many requests, blocking rpc call`);
                this._nbThrottledRpcCalls++;
                throw eth_rpc_errors_1.ethErrors.rpc.limitExceeded();
            }
        });
    }
    _requestHandler(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log(`RPC call: ${JSON.stringify(req.body)}`);
            const { method, params, id, jsonrpc } = req.body;
            const chainId = req.params.chainId
                ? parseInt(req.params.chainId)
                : this._mainChainId;
            try {
                // Reject invalid JsonRPC requests
                if (!method || !params)
                    throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest();
                if (method == "nbRpcCallsRemaining") {
                    const nbRpcCallsRemaining = Math.max(0, this._limit - this.getNbRpcCalls().total);
                    res.send({ result: { nbRpcCallsRemaining }, id, jsonrpc });
                    return;
                }
                this._nbRpcCalls++;
                // Apply rate limiting for non whitelisted methods
                if (!this._whitelistedMethods.includes(method)) {
                    yield this._checkRateLimit();
                }
                // Forward RPC call to internal provider
                try {
                    const provider = this._providers.get(chainId);
                    if (!provider)
                        throw eth_rpc_errors_1.ethErrors.provider.chainDisconnected();
                    const result = yield provider.send(method, params);
                    // Send result as valid JsonRPC response
                    res.send({ result, id, jsonrpc });
                }
                catch (providerError) {
                    // Extract internal provider error
                    let parsedProviderError;
                    if (providerError.body) {
                        try {
                            const jsonResponse = JSON.parse(providerError.body);
                            parsedProviderError = jsonResponse.error;
                        }
                        catch (_err) {
                            parsedProviderError = providerError;
                        }
                        throw parsedProviderError;
                    }
                    throw providerError;
                }
            }
            catch (_error) {
                // Standardizing RPC error before returning to the user
                // If the serializer cannot extract a valid error, it will fallback to: { code: -32603, message: 'Internal JSON-RPC error.'}
                const { code, message, data } = (0, eth_rpc_errors_1.serializeError)(_error);
                // Send result as valid JsonRPC error
                res.send({ id, jsonrpc, error: { code, message, data } });
            }
        });
    }
    _instantiateProvider(multiChainProviders) {
        const chainIds = [];
        for (const [chainIdStr, provider] of Object.entries(multiChainProviders)) {
            const chainId = parseInt(chainIdStr);
            this._providers.set(chainId, provider);
            chainIds.push(chainId);
        }
        this._log(`Providers injected for chainIds: ${JSON.stringify(chainIds)}`);
        if (!chainIds.includes(this._mainChainId)) {
            throw new Error(`Proxy provider cannot be instantiated, default chainId ${this._mainChainId} doesn't have a provider configured`);
        }
    }
    start(port = 3000) {
        return __awaiter(this, void 0, void 0, function* () {
            this._proxyUrl = `${this._host}:${port}/${this._mountPath}`;
            yield new Promise((resolve) => {
                this._server = this._app.listen(port, () => {
                    this._log(`Listening on: ${this._proxyUrl}`);
                    resolve();
                });
            });
            this._app.use(body_parser_1.default.json());
            this._app.post(`/${this._mountPath}/`, this._requestHandler.bind(this));
            this._app.post(`/${this._mountPath}/:chainId`, this._requestHandler.bind(this));
        });
    }
    getNbRpcCalls() {
        return {
            total: this._nbRpcCalls,
            throttled: this._nbThrottledRpcCalls,
        };
    }
    getProxyUrl() {
        return this._proxyUrl;
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionProxyProvider: ${message}`);
    }
    stop() {
        if (!this._isStopped) {
            this._isStopped = true;
            if (this._server)
                this._server.close();
        }
    }
}
exports.Web3FunctionProxyProvider = Web3FunctionProxyProvider;
