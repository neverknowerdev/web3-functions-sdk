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
const safe_1 = __importDefault(require("colors/safe"));
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const builder_1 = require("../builder");
const OK = safe_1.default.green("✓");
const web3FunctionSrcPath = (_a = process.argv[3]) !== null && _a !== void 0 ? _a : path_1.default.join(process.cwd(), "src", "web3-functions", "index.ts");
function deploy(w3fPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const cid = yield builder_1.Web3FunctionBuilder.deploy(w3fPath !== null && w3fPath !== void 0 ? w3fPath : web3FunctionSrcPath);
        console.log(` ${OK} Web3Function deployed to ipfs.`);
        console.log(` ${OK} CID: ${cid}`);
        console.log(`\nTo create a task that runs your Web3 Function every minute, visit:`);
        console.log(`> https://app.gelato.network/new-task?cid=${cid}`);
    });
}
exports.default = deploy;
