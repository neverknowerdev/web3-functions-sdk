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
const config_1 = require("hardhat/config");
const test_1 = __importDefault(require("../../lib/binaries/test"));
const loader_1 = require("../../lib/loader");
const provider_1 = require("../provider");
(0, config_1.task)("w3f-run", "Runs Gelato Web3 Function")
    .addFlag("debug", "Enable debug mode")
    .addFlag("logs", "Show Web3 Function logs")
    .addFlag("onfail", "Runs onFail callback")
    .addFlag("onsuccess", "Runs onSuccess callback")
    .addPositionalParam("name", "Web3 Function name defined in hardhat config")
    .setAction((taskArgs, hre) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const w3f = loader_1.Web3FunctionLoader.load(taskArgs.name, hre.config.w3f.rootDir);
    const provider = new provider_1.EthersProviderWrapper(hre.network.provider);
    const debug = (_a = taskArgs.debug) !== null && _a !== void 0 ? _a : hre.config.w3f.debug;
    const onFail = (_b = taskArgs.onfail) !== null && _b !== void 0 ? _b : false;
    const onSuccess = (_c = taskArgs.onsuccess) !== null && _c !== void 0 ? _c : false;
    const operation = onFail ? "onFail" : onSuccess ? "onSuccess" : "onRun";
    const chainId = (_d = hre.network.config.chainId) !== null && _d !== void 0 ? _d : (yield provider.getNetwork()).chainId;
    const multiChainProviderConfig = yield (0, provider_1.getMultiChainProviderConfigs)(hre);
    const callConfig = {
        operation,
        w3fPath: w3f.path,
        debug,
        showLogs: taskArgs.logs,
        runtime: "thread",
        userArgs: w3f.userArgs,
        storage: w3f.storage,
        secrets: w3f.secrets,
        multiChainProviderConfig,
        chainId,
        log: w3f.log,
    };
    yield (0, test_1.default)(callConfig);
}));
