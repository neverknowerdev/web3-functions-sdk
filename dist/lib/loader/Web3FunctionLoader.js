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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3FunctionLoader = void 0;
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Web3FunctionLoader {
    static _loadJson(path) {
        if (fs.existsSync(path)) {
            const jsonString = fs.readFileSync(path, "utf8");
            return JSON.parse(jsonString);
        }
        return {};
    }
    static _loadLog(path) {
        const log = this._loadJson(path);
        return Object.keys(log).length === 0 ? undefined : log;
    }
    static _loadSecrets(path) {
        var _a;
        const secrets = {};
        if (fs.existsSync(path)) {
            const config = (_a = dotenv.config({ path }).parsed) !== null && _a !== void 0 ? _a : {};
            Object.keys(config).forEach((key) => {
                secrets[key] = config[key];
            });
        }
        return secrets;
    }
    static load(w3fName, w3fRootDir) {
        const w3fPath = path.join(w3fRootDir, w3fName);
        const cachedDetails = this._cache.get(w3fPath);
        if (cachedDetails) {
            return cachedDetails;
        }
        const details = {
            path: "",
            userArgs: {},
            storage: {},
            secrets: {},
        };
        const stats = fs.statSync(w3fPath);
        if (stats.isDirectory()) {
            const jsPath = path.join(w3fPath, "index.js");
            const tsPath = path.join(w3fPath, "index.ts");
            const userArgsJsonPath = path.join(w3fPath, "userArgs.json");
            const storageJsonPath = path.join(w3fPath, "storage.json");
            const logJsonPath = path.join(w3fPath, "log.json");
            const secretsPath = path.join(w3fPath, ".env");
            // Get web3 function
            if (fs.existsSync(tsPath)) {
                details.path = tsPath;
            }
            else if (fs.existsSync(jsPath)) {
                details.path = jsPath;
            }
            else
                throw new Error(`Web3 Function "${w3fName}" not found!`);
            // Get userArgs
            try {
                details.userArgs = this._loadJson(userArgsJsonPath);
            }
            catch (error) {
                console.error(`Error reading userArgs.json for ${w3fName}: ${error.message}`);
            }
            // Get storage
            try {
                details.storage = this._loadJson(storageJsonPath);
            }
            catch (error) {
                console.error(`Error reading storage.json for ${w3fName}: ${error.message}`);
            }
            // Get secrets
            try {
                details.secrets = this._loadSecrets(secretsPath);
            }
            catch (error) {
                console.error(`Error reading .env for ${w3fName}: ${error.message}`);
            }
            // Get event log
            try {
                details.log = this._loadLog(logJsonPath);
            }
            catch (error) {
                console.error(`Error reading log.json for ${w3fName}: ${error.message}`);
            }
        }
        this._cache.set(w3fPath, details);
        return details;
    }
}
exports.Web3FunctionLoader = Web3FunctionLoader;
Web3FunctionLoader._cache = new Map();
