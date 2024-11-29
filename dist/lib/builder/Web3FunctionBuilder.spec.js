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
const Web3FunctionBuilder_1 = require("./Web3FunctionBuilder");
describe("Web3FunctionBuilder.build", () => {
    const TEST_FOLDER_BASE = node_path_1.default.join(process.cwd(), "src/lib/builder/__test__/");
    const buildTestPath = (folder) => {
        return node_path_1.default.join(TEST_FOLDER_BASE, folder);
    };
    const buildSchemaPath = (folder) => {
        return node_path_1.default.join(buildTestPath(folder), "index.ts");
    };
    test("should fail when input path does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("not-existing"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("Missing Web3Function schema");
        }
    }));
    test("should fail when input path does not have schema.json", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("no-schema"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("Missing Web3Function schema");
        }
    }));
    test("should fail when schema is missing a required field", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("missing-required-field"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("must have required property");
        }
    }));
    test("should fail when schema major version does not match with the SDK version", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-version"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("must match the major version of the installed sdk");
        }
    }));
    test("should fail when schema memory config is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-memory"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("'memory' must be equal to one of the allowed values");
        }
    }));
    test("should fail when schema execution mode is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-execution-mode"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("'executionMode' must be equal to one of the allowed values [sequential|parallel]");
        }
    }));
    test("should fail when schema runtime config is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-runtime"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("'runtime' must be equal to one of the allowed values");
        }
    }));
    test("should fail when schema eventRetry config is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-event-retry"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("'eventRetryInterval' must be >= 60");
            expect(res.error.message).toMatch("'eventRetryTtl' must be <= 259200");
        }
    }));
    test("should fail when schema timeout is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-timeout"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message.includes("'timeout' must be")).toBeTruthy();
        }
    }));
    test("should fail when schema userArgs include unknown types", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("invalid-schema-userargs"));
        expect(res.success).toBeFalsy();
        if (res.success === false) {
            expect(res.error.message).toMatch("must be equal to one of the allowed values");
        }
    }));
    test("should pass when schema is valid", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = node_path_1.default.join(buildTestPath("valid-schema"), "index.js");
        const res = yield Web3FunctionBuilder_1.Web3FunctionBuilder.build(buildSchemaPath("valid-schema"), {
            filePath,
            sourcePath: node_path_1.default.join(buildTestPath("valid-schema"), "source.js"),
        });
        expect(res.success).toBeTruthy();
        if (res.success) {
            expect(res.filePath).toEqual(filePath);
        }
    }));
});
