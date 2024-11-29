#! /usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const semver = __importStar(require("semver"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../package.json");
const safe_1 = __importDefault(require("colors/safe"));
const KO = safe_1.default.red("✗");
const verifyNodeVersionAndRun = () => __awaiter(void 0, void 0, void 0, function* () {
    const supportedNodeVersionRange = packageJson.engines.node;
    const currentVersion = process.version;
    if (!semver.satisfies(currentVersion, supportedNodeVersionRange)) {
        console.error(`${KO}: You are using Node.js version ${currentVersion}, but w3f CLI requires Node.js version ${supportedNodeVersionRange}. Please upgrade your Node.js version.`);
    }
    else
        yield runCliCommand();
});
const runCliCommand = () => __awaiter(void 0, void 0, void 0, function* () {
    const command = process.argv[2];
    const benchmark = yield Promise.resolve().then(() => __importStar(require("../lib/binaries/benchmark")));
    const fetch = yield Promise.resolve().then(() => __importStar(require("../lib/binaries/fetch")));
    const deploy = yield Promise.resolve().then(() => __importStar(require("../lib/binaries/deploy")));
    const schema = yield Promise.resolve().then(() => __importStar(require("../lib/binaries/schema")));
    const test = yield Promise.resolve().then(() => __importStar(require("../lib/binaries/test")));
    switch (command) {
        case "test":
            test
                .default()
                .catch((err) => console.error(` ${KO} Error running Web3Function: ${err.message}`));
            break;
        case "benchmark":
            benchmark
                .default()
                .catch((err) => console.error(` ${KO} Error running benchmark: ${err.message}`));
            break;
        case "fetch":
            fetch
                .default()
                .catch((err) => console.error(` ${KO} Fetching Web3Function failed: ${err.message}`));
            break;
        case "deploy":
            deploy
                .default()
                .catch((err) => console.error(` ${KO} Deploying Web3Function failed: ${err.message}`));
            break;
        case "schema":
            schema
                .default()
                .catch((err) => console.error(` ${KO} Fetching schema failed: ${err.message}`));
            break;
        default:
            console.error(` ${KO} Unknown command: ${command}`);
    }
});
verifyNodeVersionAndRun();
