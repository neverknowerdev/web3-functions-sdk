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
const globals_1 = require("@jest/globals");
const safe_1 = __importDefault(require("colors/safe"));
const path_1 = __importDefault(require("path"));
const test_1 = __importDefault(require("../binaries/test"));
const Web3FunctionRunner_1 = require("./Web3FunctionRunner");
describe("Web3FunctionRunner", () => {
    const FUNCTIONS_BASE_PATH = path_1.default.join(process.cwd(), "src", "web3-functions");
    const LOCAL_BASE_PATH = path_1.default.join(process.cwd(), "src", "lib", "runtime", "__test__");
    describe("Parse User arguments", () => {
        const userArgsSchema = {
            myArray: "string[]",
            myPrimitive: "boolean",
            myMissing: "number",
        };
        test("should throw for missing user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.parseUserArgs(userArgsSchema, {
                    myArray: '["hello", "world"]',
                    myPrimitive: "false",
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Missing user arg 'myMissing'");
            }
        });
        test("should throw when primitive is provided for array expected user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.parseUserArgs(userArgsSchema, {
                    myArray: '"hello"',
                    myPrimitive: "false",
                    myMissing: "12",
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid string[] value");
            }
        });
        test("should throw when array is provided for primitive expected user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.parseUserArgs(userArgsSchema, {
                    myArray: '["hello", "world"]',
                    myPrimitive: "[false, true]",
                    myMissing: "12",
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid boolean value");
            }
        });
        test("should throw when unexpected typed value is provided for user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.parseUserArgs(userArgsSchema, {
                    myArray: '[false, "world"]',
                    myPrimitive: "false",
                    myMissing: "12",
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid string[]");
            }
            try {
                runner.parseUserArgs(userArgsSchema, {
                    myArray: '[false, "world"]',
                    myPrimitive: "false",
                    myMissing: "false",
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid string[]");
            }
        });
    });
    describe("Validate Args", () => {
        const userArgsSchema = {
            myArray: "string[]",
            myPrimitive: "boolean",
            myMissing: "number",
        };
        test("should throw for missing user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.validateUserArgs(userArgsSchema, {
                    myArray: ["hello", "world"],
                    myPrimitive: false,
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Missing user arg 'myMissing'");
            }
        });
        test("should throw when primitive is provided for array expected user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.validateUserArgs(userArgsSchema, {
                    myArray: "hello",
                    myPrimitive: false,
                    myMissing: 12,
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid string[] value");
            }
        });
        test("should throw when array is provided for primitive expected user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.validateUserArgs(userArgsSchema, {
                    myArray: ["hello", "world"],
                    myPrimitive: [false, true],
                    myMissing: 12,
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid boolean value");
            }
        });
        test("should throw when unexpected typed value is provided for user argument", () => {
            const runner = new Web3FunctionRunner_1.Web3FunctionRunner(false);
            try {
                runner.validateUserArgs(userArgsSchema, {
                    myArray: [false, "world"],
                    myPrimitive: false,
                    myMissing: 12,
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid string[]");
            }
            try {
                runner.validateUserArgs(userArgsSchema, {
                    myArray: [false, "world"],
                    myPrimitive: false,
                    myMissing: false,
                });
                expect(false).toBeTruthy();
            }
            catch (err) {
                expect(err.message).toMatch("Web3FunctionSchemaError: Invalid string[]");
            }
        });
    });
    describe("Function runs", () => {
        const consoleSpy = globals_1.jest.spyOn(console, "log");
        beforeEach(() => {
            consoleSpy.mockClear();
        });
        test("should return canExec false with message", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(LOCAL_BASE_PATH, "simple.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Return value: {"canExec":false,"message":"Simple"}'));
        }));
        test("should report when function doesn't return a result", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "no-result", "index.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Error: Web3Function exited without returning result"));
        }));
        test("should report rpc limit exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "rpc-provider-limit", "index.ts"),
                rpcLimit: 20,
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("RPC requests limit exceeded"));
        }), 30000);
        test("should report network limit exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "request-limit", "index.ts"),
                requestLimit: 20,
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Please reduce your network usage"));
        }), 20000);
        test("should report download limit exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "download-limit", "index.ts"),
                downloadLimit: 20,
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`[${safe_1.default.red("✗")} DL:`));
        }), 20000);
        test("should report storage exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "escape-storage", "index.ts"),
                storage: {
                    myLastMessage: "Lorem ipsum",
                },
                storageLimit: 1, // 1 kb
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Storage usage exceeds limit"));
        }), 20000);
        test("should report memory exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "escape-memory", "index.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Memory limit exceeded"));
        }), 20000);
        test("should report unhandled promise rejection", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "unhandled-exception", "index.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unhandled promise rejection"));
        }), 20000);
        test("should not start function with no run handler", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(FUNCTIONS_BASE_PATH, "fails", "not-registered", "index.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Web3Function start-up timeout"));
        }), 20000);
        test("should report invalid return", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(LOCAL_BASE_PATH, "invalid-return.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Web3Function must return"));
        }), 20000);
        test("should report invalid return with no canExec", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(LOCAL_BASE_PATH, "invalid-return-no-canexec.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Web3Function must return"));
        }), 20000);
        test("should report invalid address with calldata", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(LOCAL_BASE_PATH, "invalid-return-calldata-address.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("returned invalid to address"));
        }), 20000);
        test("should report invalid data with calldata", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(LOCAL_BASE_PATH, "invalid-return-calldata-data.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("returned invalid callData"));
        }), 20000);
        test("should report invalid value with calldata", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, test_1.default)({
                w3fPath: path_1.default.join(LOCAL_BASE_PATH, "invalid-return-calldata-value.ts"),
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("returned invalid value (must be numeric string)"));
        }), 20000);
    });
});
