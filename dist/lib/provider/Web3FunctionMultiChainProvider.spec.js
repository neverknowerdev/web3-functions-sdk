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
const providers_1 = require("@ethersproject/providers");
const Web3FunctionMultiChainProvider_1 = require("./Web3FunctionMultiChainProvider");
const Web3FunctionProxyProvider_1 = require("./Web3FunctionProxyProvider");
describe("Web3FunctionMultiChainProvider", () => {
    let TestChainIds;
    (function (TestChainIds) {
        TestChainIds[TestChainIds["Sepolia"] = 11155111] = "Sepolia";
        TestChainIds[TestChainIds["Amoy"] = 80002] = "Amoy";
    })(TestChainIds || (TestChainIds = {}));
    let TestChainProviders;
    (function (TestChainProviders) {
        TestChainProviders["Sepolia"] = "https://rpc.ankr.com/eth_sepolia";
        TestChainProviders["Amoy"] = "https://rpc.ankr.com/polygon_amoy";
    })(TestChainProviders || (TestChainProviders = {}));
    let proxyProvider;
    let multichainProvider;
    let rateLimitInvoked = false;
    const rpcLimit = 5;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const proxyProviderHost = "http://127.0.0.1";
        const proxyProviderPort = 3000;
        const multiChainProviderConfig = {
            [TestChainIds.Sepolia]: new providers_1.StaticJsonRpcProvider(TestChainProviders.Sepolia),
            [TestChainIds.Amoy]: new providers_1.StaticJsonRpcProvider(TestChainProviders.Amoy),
        };
        proxyProvider = new Web3FunctionProxyProvider_1.Web3FunctionProxyProvider(proxyProviderHost, rpcLimit, TestChainIds.Sepolia, multiChainProviderConfig, false);
        yield proxyProvider.start(proxyProviderPort);
        multichainProvider = new Web3FunctionMultiChainProvider_1.Web3FunctionMultiChainProvider(proxyProvider.getProxyUrl(), TestChainIds.Sepolia, () => {
            rateLimitInvoked = true;
        });
    }));
    afterAll(() => {
        proxyProvider.stop();
    });
    test("should get remaining rpc calls", () => __awaiter(void 0, void 0, void 0, function* () {
        let nbRpcCallsRemaining = yield multichainProvider.nbRpcCallsRemaining();
        expect(nbRpcCallsRemaining).toBe(rpcLimit);
        yield multichainProvider.default().getBlock("latest");
        nbRpcCallsRemaining = yield multichainProvider.nbRpcCallsRemaining();
        expect(nbRpcCallsRemaining).toBe(rpcLimit - 1);
    }));
    test("should get default provider with chainId", () => __awaiter(void 0, void 0, void 0, function* () {
        const chainNetwork = yield multichainProvider
            .chainId(11155111)
            .getNetwork();
        const mainChainNetwork = yield multichainProvider.default().getNetwork();
        expect(chainNetwork.chainId).toEqual(mainChainNetwork.chainId);
    }));
    test("should invoke rate limit callback when rate limit exceed", () => __awaiter(void 0, void 0, void 0, function* () {
        rateLimitInvoked = false;
        const limitingRequests = Array.from({ length: rpcLimit }, () => __awaiter(void 0, void 0, void 0, function* () { return yield multichainProvider.default().getBlock("latest"); }));
        try {
            yield Promise.allSettled(limitingRequests);
        }
        catch (error) {
            expect(rateLimitInvoked).toBeTruthy();
        }
    }), 20000);
    test("should fail when RPC is not configured for the chainId", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield multichainProvider.chainId(100).getBlockNumber();
            throw new Error("Provider is connected");
        }
        catch (error) {
            expect(error.message.includes("provider is disconnected"));
        }
    }));
});
