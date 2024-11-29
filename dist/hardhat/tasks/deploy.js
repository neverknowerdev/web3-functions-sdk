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
const deploy_1 = __importDefault(require("../../lib/binaries/deploy"));
const loader_1 = require("../../lib/loader");
(0, config_1.task)("w3f-deploy", "Deploys Gelato Web3 Function")
    .addPositionalParam("name", "Web3 Function name defined in hardhat config")
    .setAction((taskArgs, hre) => __awaiter(void 0, void 0, void 0, function* () {
    const w3f = loader_1.Web3FunctionLoader.load(taskArgs.name, hre.config.w3f.rootDir);
    yield (0, deploy_1.default)(w3f.path);
}));
