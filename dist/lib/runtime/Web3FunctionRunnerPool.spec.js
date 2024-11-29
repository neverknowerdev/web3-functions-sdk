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
const providers_1 = require("@ethersproject/providers");
const globals_1 = require("@jest/globals");
const path_1 = __importDefault(require("path"));
const builder_1 = require("../builder");
const types_1 = require("../types");
const Web3FunctionRunnerPool_1 = require("./Web3FunctionRunnerPool");
const MAX_RPC_LIMIT = 100;
const MAX_DOWNLOAD_LIMIT = 10 * 1024 * 1024;
const MAX_UPLOAD_LIMIT = 5 * 1024 * 1024;
const MAX_REQUEST_LIMIT = 110;
const MAX_STORAGE_LIMIT = 1024; // kb
describe("Web3FunctionRunnerPool", () => {
    const LOCAL_BASE_PATH = path_1.default.join(process.cwd(), "src", "lib", "runtime", "__test__");
    test("runner pool", () => __awaiter(void 0, void 0, void 0, function* () {
        const consoleSpy = globals_1.jest.spyOn(console, "log");
        const buildRes = yield builder_1.Web3FunctionBuilder.build(path_1.default.join(LOCAL_BASE_PATH, "simple.ts"));
        if (buildRes.success) {
            const multiChainProviderConfig = {
                11155111: new providers_1.StaticJsonRpcProvider("https://rpc.ankr.com/eth_sepolia"),
            };
            const runner = new Web3FunctionRunnerPool_1.Web3FunctionRunnerPool(2, true);
            const options = {
                runtime: "thread",
                showLogs: false,
                memory: buildRes.schema.memory,
                rpcLimit: MAX_RPC_LIMIT,
                timeout: buildRes.schema.timeout * 1000,
                downloadLimit: MAX_DOWNLOAD_LIMIT,
                uploadLimit: MAX_UPLOAD_LIMIT,
                requestLimit: MAX_REQUEST_LIMIT,
                storageLimit: MAX_STORAGE_LIMIT,
                blacklistedHosts: ["testblacklistedhost.com"],
            };
            const context = {
                secrets: {},
                storage: {},
                gelatoArgs: {
                    chainId: 11155111,
                    gasPrice: "10",
                },
                userArgs: {},
            };
            yield runner.run("onRun", {
                script: buildRes.filePath,
                version: types_1.Web3FunctionVersion.V2_0_0,
                context,
                options,
                multiChainProviderConfig,
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Web3FunctionRunnerPool"));
        }
        else {
            expect(true).toBeFalsy();
        }
    }));
});
