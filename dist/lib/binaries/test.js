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
const safe_1 = __importDefault(require("colors/safe"));
const path_1 = __importDefault(require("path"));
const builder_1 = require("../builder");
const loader_1 = require("../loader");
const runtime_1 = require("../runtime");
const STD_TIMEOUT = 10;
const STD_RPC_LIMIT = 10;
const STD_STORAGE_LIMIT = 1024;
const MAX_RPC_LIMIT = 500;
const MAX_DOWNLOAD_LIMIT = 10 * 1024 * 1024;
const MAX_UPLOAD_LIMIT = 5 * 1024 * 1024;
const MAX_REQUEST_LIMIT = 510;
const MAX_STORAGE_LIMIT = 10024; // 10 mb
const OK = safe_1.default.green("✓");
const KO = safe_1.default.red("✗");
const WARN = safe_1.default.yellow("⚠");
function logWithStatus(status, message, indent = 0) {
    const indentation = " ".repeat(indent);
    console.log(`${indentation}${status} ${message}`);
}
function logStorage(storage) {
    // Show storage update
    if ((storage === null || storage === void 0 ? void 0 : storage.state) === "updated") {
        console.log(`\nSimulated Web3Function Storage update:`);
        Object.entries(storage.storage).forEach(([key, value]) => {
            const coloredValue = safe_1.default.green(`'${value}'`);
            logWithStatus(OK, `${key}: ${coloredValue}`, 1);
        });
    }
}
function logDurationStats(res) {
    if (res.throttled.duration) {
        logWithStatus(KO, `Duration: ${res.duration.toFixed(2)}s`, 1);
    }
    else if (res.duration > STD_TIMEOUT) {
        logWithStatus(WARN, `Duration: ${res.duration.toFixed(2)}s (Runtime is above Standard plan limit: ${STD_TIMEOUT}s!)`, 1);
    }
    else {
        logWithStatus(OK, `Duration: ${res.duration.toFixed(2)}s`, 1);
    }
}
function logMemoryStats(res) {
    logWithStatus(res.throttled.memory ? KO : OK, `Memory: ${res.memory.toFixed(2)}mb`, 1);
}
function logStorageStats(res) {
    var _a, _b;
    if (res.success && res.throttled.storage) {
        logWithStatus(KO, `Storage: ${res.storage.size.toFixed(2)}kb - Storage usage exceeds limit!`, 1);
    }
    else if (res.success && ((_a = res.storage) === null || _a === void 0 ? void 0 : _a.size) > STD_STORAGE_LIMIT) {
        logWithStatus(KO, `Storage: ${res.storage.size.toFixed(2)}kb (Storage usage is above Standard plan limit: ${STD_STORAGE_LIMIT}kb!)`, 1);
    }
    else if (res.success && ((_b = res.storage) === null || _b === void 0 ? void 0 : _b.size) > 0) {
        logWithStatus(OK, `Storage: ${res.storage.size.toFixed(2)}kb`, 1);
    }
}
function logNetworkStats(res) {
    let networkMessage = `Network: ${res.network.nbRequests} req [${res.throttled.download ? KO : ""} DL: ${res.network.download.toFixed(2)}kb / UL: ${res.throttled.upload ? KO : ""} ${res.network.upload.toFixed(2)}kb]`;
    if (res.throttled.networkRequest) {
        networkMessage += ` (${res.network.nbThrottled} req throttled - Please reduce your network usage!)`;
    }
    logWithStatus(res.throttled.networkRequest ? KO : OK, networkMessage, 1);
}
function logRPCStats(res) {
    if (res.throttled.rpcRequest) {
        logWithStatus(KO, `Rpc calls: ${res.rpcCalls.total} (${res.rpcCalls.throttled} throttled - Please reduce your rpc usage!)`, 1);
    }
    else if (res.rpcCalls.total > STD_RPC_LIMIT) {
        logWithStatus(WARN, `Rpc calls: ${res.rpcCalls.total} (RPC usage is above Standard plan limit: ${STD_RPC_LIMIT}!)`, 1);
    }
    else {
        logWithStatus(OK, `Rpc calls: ${res.rpcCalls.total}`, 1);
    }
}
function logResult(operation, res) {
    // Show Web3Function result
    console.log(`\nWeb3Function ${operation} result:`);
    if (res.success) {
        if (operation === "onRun") {
            logWithStatus(OK, `Return value: ${JSON.stringify(res.result)}`, 1);
        }
        else {
            logWithStatus(OK, `Success`, 1);
        }
        logStorage(res.storage);
    }
    else {
        logWithStatus(KO, `Error: ${res.error.message}`, 1);
    }
    // Show runtime stats
    console.log(`\nWeb3Function Runtime stats:`);
    logDurationStats(res);
    logMemoryStats(res);
    logStorageStats(res);
    logNetworkStats(res);
    logRPCStats(res);
}
function test(callConfig) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const defaultCallConfig = {
            operation: "onRun",
            userArgs: {},
            chainId: 11155111,
            multiChainProviderConfig: {
                11155111: new providers_1.StaticJsonRpcProvider("https://rpc.ankr.com/eth_sepolia"),
            },
            runtime: "thread",
            debug: false,
            showLogs: false,
            storage: {},
            secrets: {},
            w3fPath: (_a = process.argv[3]) !== null && _a !== void 0 ? _a : path_1.default.join(process.cwd(), "src", "web3-functions", "index.ts"),
            rpcLimit: MAX_RPC_LIMIT,
            requestLimit: MAX_REQUEST_LIMIT,
            downloadLimit: MAX_DOWNLOAD_LIMIT,
            uploadLimit: MAX_UPLOAD_LIMIT,
            storageLimit: MAX_STORAGE_LIMIT,
        };
        if (!callConfig) {
            callConfig = {};
            callConfig.multiChainProviderConfig = {};
            if (!process.env.PROVIDER_URLS) {
                console.error(`Missing PROVIDER_URLS in .env file`);
                process.exit();
            }
            const providerUrls = process.env.PROVIDER_URLS.split(",");
            for (const url of providerUrls) {
                const provider = new providers_1.StaticJsonRpcProvider(url);
                const chainId = (yield provider.getNetwork()).chainId;
                callConfig.multiChainProviderConfig[chainId] = provider;
            }
            for (const arg of process.argv.slice(3)) {
                if (arg.startsWith("--debug")) {
                    callConfig.debug = true;
                }
                else if (arg.startsWith("--logs")) {
                    callConfig.showLogs = true;
                }
                else if (arg.startsWith("--runtime=")) {
                    const type = arg.split("=")[1];
                    callConfig.runtime = type === "docker" ? "docker" : "thread";
                }
                else if (arg.startsWith("--chain-id")) {
                    callConfig.chainId = parseInt(arg.split("=")[1]);
                }
                else if (arg.startsWith("--onFail")) {
                    callConfig.operation = "onFail";
                }
                else if (arg.startsWith("--onSuccess")) {
                    callConfig.operation = "onSuccess";
                }
            }
            // Load Web3Function details (userArgs, secrets, storage)
            const parsedPathParts = path_1.default
                .parse(defaultCallConfig.w3fPath)
                .dir.split(path_1.default.sep);
            const w3fName = (_b = parsedPathParts.pop()) !== null && _b !== void 0 ? _b : "";
            const w3fRootDir = parsedPathParts.join(path_1.default.sep);
            const w3fDetails = loader_1.Web3FunctionLoader.load(w3fName, w3fRootDir);
            callConfig.userArgs = w3fDetails.userArgs;
            callConfig.secrets = w3fDetails.secrets;
            callConfig.storage = w3fDetails.storage;
            callConfig.log = w3fDetails.log;
        }
        // Overwrite default with the callConfig
        for (const key of Object.keys(callConfig)) {
            if (callConfig[key]) {
                defaultCallConfig[key] = callConfig[key];
            }
        }
        // Build Web3Function
        console.log(`Web3Function building...`);
        const { operation, w3fPath, debug, secrets, storage, chainId, userArgs, runtime, showLogs, multiChainProviderConfig, log, } = defaultCallConfig;
        const buildRes = yield builder_1.Web3FunctionBuilder.build(w3fPath, { debug });
        console.log(`\nWeb3Function Build result:`);
        if (!buildRes.success) {
            logWithStatus(KO, `Error: ${buildRes.error.message}`, 1);
            return;
        }
        logWithStatus(OK, `Schema: ${buildRes.schemaPath}`, 1);
        logWithStatus(OK, `Built file: ${buildRes.filePath}`, 1);
        logWithStatus(OK, `File size: ${buildRes.fileSize.toFixed(2)}mb`, 1);
        logWithStatus(OK, `Build time: ${buildRes.buildTime.toFixed(2)}ms`, 1);
        // Prepare mock content for test
        const baseContext = {
            secrets,
            storage,
            gelatoArgs: {
                chainId,
                gasPrice: "10",
            },
            userArgs,
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
        // Configure Web3Function runner
        const runner = new runtime_1.Web3FunctionRunner(debug);
        const memory = buildRes.schema.memory;
        const timeout = buildRes.schema.timeout * 1000;
        const version = buildRes.schema.web3FunctionVersion;
        const rpcLimit = defaultCallConfig.rpcLimit;
        const options = {
            runtime,
            showLogs,
            memory,
            rpcLimit,
            timeout,
            downloadLimit: defaultCallConfig.downloadLimit,
            uploadLimit: defaultCallConfig.uploadLimit,
            requestLimit: defaultCallConfig.requestLimit,
            storageLimit: defaultCallConfig.storageLimit,
            blacklistedHosts: ["testblacklistedhost.com"],
        };
        const script = buildRes.filePath;
        // Validate user args against schema
        console.log(`\nWeb3Function user args validation:`);
        try {
            runner.validateUserArgs(buildRes.schema.userArgs, userArgs);
            Object.keys(context.userArgs).forEach((key) => {
                logWithStatus(OK, `${key}: ${context.userArgs[key]}`, 1);
            });
        }
        catch (err) {
            logWithStatus(KO, err.message, 1);
            return;
        }
        // Run Web3Function
        console.log(`\nWeb3Function running${showLogs ? " logs:" : "..."}`);
        const res = yield runner.run(operation, {
            script,
            version,
            context,
            options,
            multiChainProviderConfig,
        });
        logResult(operation, res);
    });
}
exports.default = test;
