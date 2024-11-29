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
require("dotenv/config");
const safe_1 = __importDefault(require("colors/safe"));
const uploader_1 = require("../uploader");
const OK = safe_1.default.green("✓");
function fetch() {
    return __awaiter(this, void 0, void 0, function* () {
        const cid = process.argv[3];
        if (!cid)
            throw new Error("Web3Function CID missing");
        const web3FunctionDir = yield uploader_1.Web3FunctionUploader.fetch(cid);
        console.log(` ${OK} Fetched Web3Function to: ${web3FunctionDir}`);
        const { schemaPath, web3FunctionPath } = yield uploader_1.Web3FunctionUploader.extract(web3FunctionDir);
        console.log(` ${OK} Extracted Web3Function. \n schemaPath: ${schemaPath} \n web3FunctionPath: ${web3FunctionPath}`);
    });
}
exports.default = fetch;
