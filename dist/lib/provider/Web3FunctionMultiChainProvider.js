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
exports.Web3FunctionMultiChainProvider = void 0;
const providers_1 = require("@ethersproject/providers");
class Web3FunctionMultiChainProvider {
    constructor(proxyRpcUrlBase, defaultChainId, rateLimitCallBack) {
        this._proxyRpcUrlBase = proxyRpcUrlBase;
        this._rateLimitCallback = rateLimitCallBack;
        this._providers = new Map();
        this._defaultProvider = new providers_1.StaticJsonRpcProvider(proxyRpcUrlBase, defaultChainId);
        this._providers.set(defaultChainId, this._defaultProvider);
        this._subscribeProviderEvents(this._defaultProvider);
    }
    default() {
        return this._defaultProvider;
    }
    chainId(chainId) {
        return this._getProviderOfChainId(chainId);
    }
    nbRpcCallsRemaining() {
        return __awaiter(this, void 0, void 0, function* () {
            const { nbRpcCallsRemaining } = yield this._defaultProvider.send("nbRpcCallsRemaining", []);
            return nbRpcCallsRemaining;
        });
    }
    _getProviderOfChainId(chainId) {
        let provider = this._providers.get(chainId);
        if (!provider) {
            provider = new providers_1.StaticJsonRpcProvider(`${this._proxyRpcUrlBase}/${chainId}`, chainId);
            this._subscribeProviderEvents(provider);
            this._providers.set(chainId, provider);
        }
        return provider;
    }
    _subscribeProviderEvents(provider) {
        provider.on("debug", (data) => {
            if (data.action === "response" && data.error) {
                if (/Request limit exceeded/.test(data.error.message)) {
                    console.error("Web3FunctionError: RPC requests limit exceeded");
                    this._rateLimitCallback();
                }
            }
        });
    }
}
exports.Web3FunctionMultiChainProvider = Web3FunctionMultiChainProvider;
