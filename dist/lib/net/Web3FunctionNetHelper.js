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
exports.Web3FunctionNetHelper = void 0;
const net_1 = __importDefault(require("net"));
class Web3FunctionNetHelper {
    static getAvailablePort(occupiedPorts = []) {
        return new Promise((resolve, reject) => {
            const srv = net_1.default.createServer();
            srv.listen(0, () => __awaiter(this, void 0, void 0, function* () {
                const address = srv.address();
                const port = address && typeof address === "object" ? address.port : -1;
                srv.close(() => __awaiter(this, void 0, void 0, function* () {
                    if (port === -1) {
                        reject(new Error("Failed to get a port."));
                        return;
                    }
                    if (occupiedPorts.includes(port)) {
                        try {
                            const newPort = yield Web3FunctionNetHelper.getAvailablePort(occupiedPorts);
                            resolve(newPort);
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                    else {
                        resolve(port);
                    }
                }));
            }));
        });
    }
    static getAvailablePorts(size) {
        return __awaiter(this, void 0, void 0, function* () {
            const ports = [];
            let retries = 0;
            const maxRetries = size * 2;
            while (ports.length < size) {
                const port = yield Web3FunctionNetHelper.getAvailablePort();
                if (ports.includes(port)) {
                    retries++;
                    if (retries === maxRetries) {
                        throw new Error(`Web3FunctionNetHelper Error: Unable to get ${size} free ports`);
                    }
                }
                else {
                    ports.push(port);
                }
            }
            return ports;
        });
    }
}
exports.Web3FunctionNetHelper = Web3FunctionNetHelper;
