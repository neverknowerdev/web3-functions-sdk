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
const node_path_1 = __importDefault(require("node:path"));
const types_1 = require("../../types");
const Web3FunctionThreadSandbox_1 = require("./Web3FunctionThreadSandbox");
describe("Web3FunctionThreadSandbox", () => {
    const SCRIPT_FOLDER = node_path_1.default.join(process.cwd(), "src", "lib", "runtime", "sandbox", "__test__");
    test("pass correct arguments to runner", () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox({
            memoryLimit: 10,
        }, false, false);
        const serverPort = 8000;
        const mountPath = "./";
        const httpProxyPort = 8080;
        yield runner.start(node_path_1.default.join(SCRIPT_FOLDER, "simple.ts"), types_1.Web3FunctionVersion.V2_0_0, serverPort, mountPath, httpProxyPort, []);
        yield runner.waitForProcessEnd();
        const logs = runner.getLogs();
        expect(logs.length).toBe(2);
        expect(logs[0]).toBe(serverPort.toString());
        expect(logs[1]).toBe(mountPath);
        yield runner.stop();
    }));
    test("should throw on invalid env access", () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox({
            memoryLimit: 10,
        }, false, false);
        const serverPort = 8000;
        const mountPath = "./";
        const httpProxyPort = 8080;
        yield runner.start(node_path_1.default.join(SCRIPT_FOLDER, "not_allowed_env.ts"), types_1.Web3FunctionVersion.V2_0_0, serverPort, mountPath, httpProxyPort, []);
        yield runner.waitForProcessEnd();
        const logs = runner.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0]).toBe("Passed");
        yield runner.stop();
    }));
    test("should error out when memory exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox({
            memoryLimit: 10,
        }, false, false);
        const serverPort = 8000;
        const mountPath = "./";
        const httpProxyPort = 8080;
        yield runner.start(node_path_1.default.join(SCRIPT_FOLDER, "exceed_memory_usage.ts"), types_1.Web3FunctionVersion.V2_0_0, serverPort, mountPath, httpProxyPort, []);
        yield runner.waitForProcessEnd();
        const logs = runner.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]).toMatch("Last few GCs");
        yield runner.stop();
    }));
    test("should report memory usage", () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox({
            memoryLimit: 10,
        }, false, false);
        const serverPort = 8000;
        const mountPath = "./";
        const httpProxyPort = 8080;
        yield runner.start(node_path_1.default.join(SCRIPT_FOLDER, "memory_usage.ts"), types_1.Web3FunctionVersion.V2_0_0, serverPort, mountPath, httpProxyPort, []);
        yield new Promise((r) => setTimeout(r, 1000));
        const memory = yield runner.getMemoryUsage();
        yield runner.waitForProcessEnd();
        yield runner.stop();
        expect(memory).toBeGreaterThan(0);
    }));
    test("should ignore stop if already stopped", () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox({
            memoryLimit: 10,
        }, false, false);
        const serverPort = 8000;
        const mountPath = "./";
        const httpProxyPort = 8080;
        yield runner.start(node_path_1.default.join(SCRIPT_FOLDER, "simple.ts"), types_1.Web3FunctionVersion.V2_0_0, serverPort, mountPath, httpProxyPort, []);
        yield runner.waitForProcessEnd();
        yield runner.stop();
        yield runner.stop();
    }));
    test("should disable access to blacklisted host", () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new Web3FunctionThreadSandbox_1.Web3FunctionThreadSandbox({
            memoryLimit: 10,
        }, false, false);
        const serverPort = 8000;
        const mountPath = "./";
        const httpProxyPort = 8080;
        yield runner.start(node_path_1.default.join(SCRIPT_FOLDER, "blacklisted_host.ts"), types_1.Web3FunctionVersion.V2_0_0, serverPort, mountPath, httpProxyPort, ["http://gelato.network"]);
        yield runner.waitForProcessEnd();
        const logs = runner.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]).toBe("Passed");
        yield runner.stop();
    }));
});
