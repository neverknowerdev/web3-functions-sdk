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
exports.EthersProviderWrapper = exports.getMultiChainProviderConfigs = void 0;
const providers_1 = require("@ethersproject/providers");
function getMultiChainProviderConfigs(hre) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const multiChainProviderConfig = {};
        try {
            const networks = hre.config.w3f.networks;
            for (const network of networks) {
                if (network != "hardhat") {
                    const networkConfig = (_a = hre.userConfig.networks) === null || _a === void 0 ? void 0 : _a[network];
                    if (!networkConfig)
                        throw new Error(`Config for network ${network} not found`);
                    const url = networkConfig["url"];
                    if (!url)
                        throw new Error(`'url' for network ${network} not found`);
                    const provider = new providers_1.StaticJsonRpcProvider(url);
                    const chainId = (_b = networkConfig.chainId) !== null && _b !== void 0 ? _b : (yield provider.getNetwork()).chainId;
                    multiChainProviderConfig[chainId] = provider;
                }
                else {
                    const provider = new EthersProviderWrapper(hre.network.provider);
                    const chainId = 31337; //hardhat chain id
                    multiChainProviderConfig[chainId] = provider;
                }
            }
        }
        catch (err) {
            console.error(`Fail to start Web3FunctionMultiChainProvider: ${err.message}`);
        }
        return multiChainProviderConfig;
    });
}
exports.getMultiChainProviderConfigs = getMultiChainProviderConfigs;
class EthersProviderWrapper extends providers_1.StaticJsonRpcProvider {
    constructor(hardhatProvider) {
        super();
        this._hardhatProvider = hardhatProvider;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._hardhatProvider.send(method, params);
            // We replicate ethers' behavior.
            this.emit("debug", {
                action: "send",
                request: {
                    id: 42,
                    jsonrpc: "2.0",
                    method,
                    params,
                },
                response: result,
                provider: this,
            });
            return result;
        });
    }
}
exports.EthersProviderWrapper = EthersProviderWrapper;
