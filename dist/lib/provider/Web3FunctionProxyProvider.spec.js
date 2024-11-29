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
const Web3FunctionProxyProvider_1 = require("./Web3FunctionProxyProvider");
const providers_1 = require("@ethersproject/providers");
const undici_1 = require("undici");
describe("Web3FunctionProxyProvider", () => {
    let TestChainIds;
    (function (TestChainIds) {
        TestChainIds[TestChainIds["Sepolia"] = 11155111] = "Sepolia";
        TestChainIds[TestChainIds["Amoy"] = 80002] = "Amoy";
        TestChainIds[TestChainIds["ArbSepolia"] = 421614] = "ArbSepolia";
    })(TestChainIds || (TestChainIds = {}));
    let TestChainProviders;
    (function (TestChainProviders) {
        TestChainProviders["Sepolia"] = "https://rpc.ankr.com/eth_sepolia";
        TestChainProviders["Amoy"] = "https://rpc.ankr.com/polygon_amoy";
        TestChainProviders["ArbSepolia"] = "https://sepolia-rollup.arbitrum.io/rpc";
    })(TestChainProviders || (TestChainProviders = {}));
    let proxyProvider;
    let multiChainProviderConfig;
    const proxyProviderHost = "http://127.0.0.1";
    let proxyProviderPort;
    const rpcLimit = 5;
    beforeAll(() => {
        // proxyProviderPort = await Web3FunctionNetHelper.getAvailablePort();
        proxyProviderPort = 3000;
        multiChainProviderConfig = {
            [TestChainIds.Sepolia]: new providers_1.StaticJsonRpcProvider(TestChainProviders.Sepolia),
            [TestChainIds.Amoy]: new providers_1.StaticJsonRpcProvider(TestChainProviders.Amoy),
            [TestChainIds.ArbSepolia]: new providers_1.StaticJsonRpcProvider(TestChainProviders.ArbSepolia),
        };
    });
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        proxyProvider = new Web3FunctionProxyProvider_1.Web3FunctionProxyProvider(proxyProviderHost, rpcLimit, TestChainIds.Sepolia, multiChainProviderConfig, false);
        yield proxyProvider.start(proxyProviderPort);
    }));
    afterEach(() => {
        proxyProvider.stop();
    });
    test("proxy provider url", () => {
        const testAddress = `${proxyProviderHost}:${proxyProviderPort}`;
        expect(proxyProvider.getProxyUrl().includes(testAddress)).toBeTruthy();
    });
    test("should reject invalid request", () => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield (0, undici_1.request)(proxyProvider.getProxyUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        });
        const response = (yield body.json());
        expect(response.error).toBeDefined();
        expect(response.error.message).toBeDefined();
        expect(response.error.message.includes("not a valid Request object.")).toBeTruthy();
    }));
    test("should rate limit exceeding requests", () => __awaiter(void 0, void 0, void 0, function* () {
        const numRequests = rpcLimit * 2;
        const limitingRequests = Array.from({ length: rpcLimit * 2 }, () => (0, undici_1.request)(proxyProvider.getProxyUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_getBlockByNumber",
                params: ["latest", false],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        })
            .then(({ body }) => body.json())
            .then((response) => {
            let fulfilled = true;
            if (response.error &&
                response.error.message.includes("Request limit exceeded")) {
                fulfilled = false;
            }
            return { fulfilled };
        })
            .catch(() => {
            const fulfilled = false;
            return { fulfilled };
        }));
        const results = yield Promise.all(limitingRequests);
        const numFulfilled = results.filter((result) => result.fulfilled).length;
        const numUnfulfilled = results.filter((result) => !result.fulfilled).length;
        expect(numFulfilled).toEqual(rpcLimit);
        expect(numUnfulfilled).toEqual(numRequests - rpcLimit);
    }), 20000);
    test("should not rate limit whitelisted methods", () => __awaiter(void 0, void 0, void 0, function* () {
        const numRequests = rpcLimit * 2;
        const limitingRequests = Array.from({ length: rpcLimit * 2 }, () => (0, undici_1.request)(proxyProvider.getProxyUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_chainId",
                params: [],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        })
            .then(({ body }) => body.json())
            .then((response) => {
            let fulfilled = true;
            if (response.error &&
                response.error.message.includes("Request limit exceeded")) {
                fulfilled = false;
            }
            return { fulfilled };
        })
            .catch(() => {
            const fulfilled = false;
            return { fulfilled };
        }));
        const results = yield Promise.all(limitingRequests);
        const numFulfilled = results.filter((result) => result.fulfilled).length;
        const numUnfulfilled = results.filter((result) => !result.fulfilled).length;
        expect(numFulfilled).toEqual(numRequests);
        expect(numUnfulfilled).toEqual(0);
    }));
    test("should return provider error", () => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield (0, undici_1.request)(proxyProvider.getProxyUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_noRequest",
                params: [],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        });
        const response = (yield body.json());
        expect(response.error).toBeDefined();
        expect(response.error.message).toBeDefined();
        expect(response.error.message.includes("does not exist")).toBeTruthy();
    }));
    test("should return original error data", () => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield (0, undici_1.request)(`${proxyProvider.getProxyUrl()}/${TestChainIds.ArbSepolia}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [
                    {
                        to: "0xac9f91277ccbb5d270e27246b203b221023a0e06",
                        data: "0x7894e0b0000000000000000000000000000000000000000000000000000000000000000a",
                    },
                    "latest",
                ],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        });
        const response = (yield body.json());
        expect(response.error).toBeDefined();
        expect(response.error.message).toBeDefined();
        expect(response.error.data).toBeDefined();
        expect(response.error.data.originalError.data).toEqual("0x110b3655000000000000000000000000000000000000000000000000000000000000000a");
    }));
    test("should respond with main chain when chainId is not provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield (0, undici_1.request)(proxyProvider.getProxyUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_chainId",
                params: [],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        });
        const mainChainIdResponse = (yield body.json());
        const { body: body2 } = yield (0, undici_1.request)(`${proxyProvider.getProxyUrl()}/${TestChainIds.Amoy}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_chainId",
                params: [],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        });
        const chainIdResponse = (yield body2.json());
        const parsedMainChainId = parseInt(mainChainIdResponse.result.substring(2), 16);
        const parsedChainId = parseInt(chainIdResponse.result.substring(2), 16);
        expect(parsedMainChainId).toEqual(TestChainIds.Sepolia);
        expect(parsedChainId).toEqual(TestChainIds.Amoy);
    }));
    test("should report RPC calls correctly", () => __awaiter(void 0, void 0, void 0, function* () {
        const numRequests = rpcLimit * 2;
        const limitingRequests = Array.from({ length: rpcLimit * 2 }, () => (0, undici_1.request)(proxyProvider.getProxyUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "eth_getBlockByNumber",
                params: ["latest", false],
            }),
            dispatcher: new undici_1.Agent({ pipelining: 0 }),
        }));
        yield Promise.all(limitingRequests);
        const rpcStats = proxyProvider.getNbRpcCalls();
        expect(rpcStats.total).toEqual(numRequests);
        expect(rpcStats.throttled).toEqual(numRequests - rpcLimit);
    }), 20000);
});
