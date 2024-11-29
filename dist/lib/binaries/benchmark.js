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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const providers_1 = require("@ethersproject/providers");
const safe_1 = __importDefault(require("colors/safe"));
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const perf_hooks_1 = require("perf_hooks");
const constants_1 = require("../../hardhat/constants");
const builder_1 = require("../builder");
const loader_1 = require("../loader");
const runtime_1 = require("../runtime");
const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));
if (!process.env.PROVIDER_URLS) {
    console.error(`Missing PROVIDER_URLS in .env file`);
    process.exit();
}
const providerUrls = process.env.PROVIDER_URLS.split(",");
const web3FunctionPath = (_a = process.argv[3]) !== null && _a !== void 0 ? _a : path_1.default.join(process.cwd(), "src", "web3-functions", "index.ts");
let operation = "onRun";
let chainId = 11155111;
let runtime = "thread";
let debug = false;
let showLogs = false;
let load = 10;
let pool = 10;
if (process.argv.length > 2) {
    process.argv.slice(3).forEach((arg) => {
        var _a, _b, _c;
        if (arg.startsWith("--debug")) {
            debug = true;
        }
        else if (arg.startsWith("--logs")) {
            showLogs = true;
        }
        else if (arg.startsWith("--runtime=")) {
            const type = arg.split("=")[1];
            runtime = type === "docker" ? "docker" : "thread";
        }
        else if (arg.startsWith("--chain-id")) {
            chainId = (_a = parseInt(arg.split("=")[1])) !== null && _a !== void 0 ? _a : chainId;
        }
        else if (arg.startsWith("--load")) {
            load = (_b = parseInt(arg.split("=")[1])) !== null && _b !== void 0 ? _b : load;
        }
        else if (arg.startsWith("--pool")) {
            pool = (_c = parseInt(arg.split("=")[1])) !== null && _c !== void 0 ? _c : pool;
        }
        else if (arg.startsWith("--onFail")) {
            operation = "onFail";
        }
        else if (arg.startsWith("--onSuccess")) {
            operation = "onSuccess";
        }
    });
}
const OK = safe_1.default.green("✓");
const KO = safe_1.default.red("✗");
function benchmark() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Build Web3Function
        const buildRes = yield builder_1.Web3FunctionBuilder.build(web3FunctionPath, {
            debug,
        });
        if (!buildRes.success) {
            console.log(`\nWeb3Function Build result:`);
            console.log(` ${KO} Error: ${buildRes.error.message}`);
            return;
        }
        // Load Web3Function details (userArgs, secrets, storage)
        const parsedPathParts = path_1.default.parse(web3FunctionPath).dir.split(path_1.default.sep);
        const w3fName = (_a = parsedPathParts.pop()) !== null && _a !== void 0 ? _a : "";
        const w3fRootDir = parsedPathParts.join(path_1.default.sep);
        const w3fDetails = loader_1.Web3FunctionLoader.load(w3fName, w3fRootDir);
        const userArgs = w3fDetails.userArgs;
        const secrets = w3fDetails.secrets;
        const storage = w3fDetails.storage;
        const log = w3fDetails.log;
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
        // Validate user args against schema
        if (Object.keys(buildRes.schema.userArgs).length > 0) {
            const runner = new runtime_1.Web3FunctionRunner(debug);
            console.log(`\nWeb3Function user args validation:`);
            try {
                runner.validateUserArgs(buildRes.schema.userArgs, userArgs);
                Object.keys(context.userArgs).forEach((key) => {
                    console.log(` ${OK} ${key}:`, context.userArgs[key]);
                });
            }
            catch (err) {
                console.log(` ${KO} ${err.message}`);
                return;
            }
        }
        const multiChainProviderConfig = {};
        for (const url of providerUrls) {
            const provider = new providers_1.StaticJsonRpcProvider(url);
            const chainId = (yield provider.getNetwork()).chainId;
            multiChainProviderConfig[chainId] = provider;
        }
        // Run Web3Function
        const start = perf_hooks_1.performance.now();
        const memory = buildRes.schema.memory;
        const timeout = buildRes.schema.timeout * 1000;
        const version = buildRes.schema.web3FunctionVersion;
        const rpcLimit = 100;
        const options = {
            runtime,
            showLogs,
            memory,
            timeout,
            rpcLimit,
            downloadLimit: constants_1.MAX_DOWNLOAD_LIMIT,
            uploadLimit: constants_1.MAX_UPLOAD_LIMIT,
            requestLimit: constants_1.MAX_REQUEST_LIMIT,
            storageLimit: constants_1.MAX_STORAGE_LIMIT,
        };
        const script = buildRes.filePath;
        const runner = new runtime_1.Web3FunctionRunnerPool(pool, debug);
        yield runner.init();
        const promises = [];
        for (let i = 0; i < load; i++) {
            console.log(`#${i} Queuing Web3Function`);
            promises.push(runner.run(operation, {
                script,
                version,
                context,
                options,
                multiChainProviderConfig,
            }));
            yield delay(100);
        }
        const results = yield Promise.all(promises);
        const duration = (perf_hooks_1.performance.now() - start) / 1000;
        console.log(`\nWeb3Function results:`);
        results.forEach((res, i) => {
            if (res.success)
                console.log(` ${OK} #${i} Success`);
            else
                console.log(` ${KO} #${i} Error:`, res.error);
        });
        const nbSuccess = results.filter((res) => res.success).length;
        console.log(`\nBenchmark result:`);
        console.log(`- nb success: ${nbSuccess}/${load}`);
        console.log(`- duration: ${duration.toFixed()}s`);
    });
}
exports.default = benchmark;
