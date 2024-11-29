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
const axios_1 = __importDefault(require("axios"));
const axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importStar(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const tar_1 = __importDefault(require("tar"));
const Web3FunctionUploader_1 = require("./Web3FunctionUploader");
const OPS_API_BASE = "https://api.gelato.digital/automate/users";
describe("Web3FunctionUploader", () => {
    let mockUserApi;
    const TEST_CID = "QmYDtW34NgZEppbR5GkGsXEkEkhT87nwX5RxiiSkzVRwb2";
    const TEST_FOLDER_BASE = node_path_1.default.join(process.cwd(), "src/lib/uploader/__test__/");
    const buildTestPath = (folder) => {
        return node_path_1.default.join(TEST_FOLDER_BASE, folder);
    };
    const buildTestTempPath = (folder) => {
        return buildTestPath(`.temp_${folder}`);
    };
    const buildSchemaPath = (folder) => {
        return node_path_1.default.join(buildTestPath(folder), "index.ts");
    };
    beforeAll(() => {
        mockUserApi = new axios_mock_adapter_1.default(axios_1.default, {
            onNoMatch: "throwException",
        });
    });
    afterEach(() => {
        mockUserApi.reset();
    });
    // Extract
    const prepareExtractTest = (folder) => __awaiter(void 0, void 0, void 0, function* () {
        const testFolder = buildTestPath(folder);
        const originalArchive = node_path_1.default.join(testFolder, `${TEST_CID}.tgz`);
        const tempFolder = buildTestTempPath(folder);
        yield promises_1.default.mkdir(tempFolder);
        const testArchive = node_path_1.default.join(tempFolder, `${TEST_CID}.tgz`);
        yield promises_1.default.copyFile(originalArchive, testArchive);
        return testArchive;
    });
    const cleanupExtractTest = (folder) => __awaiter(void 0, void 0, void 0, function* () {
        yield promises_1.default.rm(buildTestTempPath(folder), { recursive: true, force: true });
    });
    test("extract should fail for invalid compressed file with missing schema", () => __awaiter(void 0, void 0, void 0, function* () {
        const testArchive = yield prepareExtractTest("no-schema-tar");
        try {
            yield Web3FunctionUploader_1.Web3FunctionUploader.extract(testArchive);
            fail("No schema TAR extracted");
        }
        catch (error) {
            expect(error.message).toMatch("ENOENT");
        }
        cleanupExtractTest("no-schema-tar");
    }));
    test("extracted files should be within cid directory", () => __awaiter(void 0, void 0, void 0, function* () {
        // Prepare test
        const testArchive = yield prepareExtractTest("valid-tar");
        // Test
        yield Web3FunctionUploader_1.Web3FunctionUploader.extract(testArchive);
        yield promises_1.default.access(node_path_1.default.join(buildTestTempPath("valid-tar"), TEST_CID));
        // Cleanup test
        cleanupExtractTest("valid-tar");
    }));
    test("should not extract unknown file from archive", () => __awaiter(void 0, void 0, void 0, function* () {
        const testArchive = yield prepareExtractTest("extra-file");
        yield Web3FunctionUploader_1.Web3FunctionUploader.extract(testArchive);
        yield expect(promises_1.default.access(node_path_1.default.join(buildTestTempPath("extra-file"), TEST_CID, "extraschema.json"), promises_1.constants.F_OK)).rejects.toThrow();
        cleanupExtractTest("extra-file");
    }));
    // Compress
    const prepareCompressTest = (folder) => __awaiter(void 0, void 0, void 0, function* () {
        const testFolder = buildTestPath(folder);
        const originalArchive = node_path_1.default.join(testFolder, `${TEST_CID}.tgz`);
        const tempFolder = buildTestTempPath(folder);
        yield promises_1.default.mkdir(tempFolder);
        yield tar_1.default.x({ file: originalArchive, cwd: tempFolder });
        return node_path_1.default.join(tempFolder, "web3Function");
    });
    test("compress should fail when build path could not be found", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistingBuildPath = buildTestPath("non-existing");
        const nonExistingSchemaPath = buildSchemaPath("non-existing");
        try {
            yield Web3FunctionUploader_1.Web3FunctionUploader.compress(nonExistingBuildPath, nonExistingSchemaPath, node_path_1.default.join(nonExistingBuildPath, "index.js"));
            fail("Compressed with non-existing build path");
        }
        catch (error) {
            expect(error.message).toMatch("build file not found at path");
        }
    }));
    test("compress should fail when schema file could not be found", () => __awaiter(void 0, void 0, void 0, function* () {
        // Prepare the test files
        const buildPath = yield prepareCompressTest("no-schema-tar");
        try {
            yield Web3FunctionUploader_1.Web3FunctionUploader.compress(node_path_1.default.join(buildPath, "index.js"), node_path_1.default.join(buildPath, "schema.json"), node_path_1.default.join(buildPath, "source.js"));
            fail("Compressed with non-existing schema file");
        }
        catch (error) {
            expect(error.message).toMatch("Schema not found at path");
        }
        cleanupExtractTest("no-schema-tar");
    }));
    // Fetch
    test("fetch should fail when User API could not found the CID", () => __awaiter(void 0, void 0, void 0, function* () {
        const cid = "some-invalid-cid";
        mockUserApi.onGet(`${OPS_API_BASE}/users/web3-function/${cid}`).reply(404, JSON.stringify({
            message: "Web3Function not found",
        }));
        try {
            yield Web3FunctionUploader_1.Web3FunctionUploader.fetch(cid);
            fail("Invalid CID is fetched");
        }
        catch (error) {
            expect(error.message).toMatch("404 Web3Function not found");
        }
    }));
    test("fetched compressed W3F should be stored on the tmp folder", () => __awaiter(void 0, void 0, void 0, function* () {
        mockUserApi
            .onGet(`${OPS_API_BASE}/users/web3-function/${TEST_CID}`)
            .reply(function () {
            return [
                200,
                node_fs_1.default.createReadStream(node_path_1.default.join(buildTestPath("valid-tar"), `${TEST_CID}.tgz`)),
            ];
        });
        const expectedPath = `.tmp/${TEST_CID}.tgz`;
        const testPath = yield Web3FunctionUploader_1.Web3FunctionUploader.fetch(TEST_CID);
        expect(testPath).toMatch(expectedPath);
        yield promises_1.default.access(node_path_1.default.join(process.cwd(), expectedPath));
        return;
    }));
    test("fetched compressed W3F should be stored on the specified folder", () => __awaiter(void 0, void 0, void 0, function* () {
        mockUserApi
            .onGet(`${OPS_API_BASE}/users/web3-function/${TEST_CID}`)
            .reply(function () {
            return [
                200,
                node_fs_1.default.createReadStream(node_path_1.default.join(buildTestPath("valid-tar"), `${TEST_CID}.tgz`)),
            ];
        });
        const expectedPath = `.tmp/my-test/${TEST_CID}.tgz`;
        const testPath = yield Web3FunctionUploader_1.Web3FunctionUploader.fetch(TEST_CID, node_path_1.default.join(process.cwd(), expectedPath));
        expect(testPath).toMatch(expectedPath);
        yield promises_1.default.access(node_path_1.default.join(process.cwd(), expectedPath));
        return;
    }));
    // Fetch schema
    test("fetching schema should fail for non-existing schema file", () => __awaiter(void 0, void 0, void 0, function* () {
        mockUserApi
            .onGet(`${OPS_API_BASE}/users/web3-function/${TEST_CID}`)
            .reply(function () {
            return [
                200,
                node_fs_1.default.createReadStream(node_path_1.default.join(buildTestPath("no-schema-tar"), `${TEST_CID}.tgz`)),
            ];
        });
        try {
            yield Web3FunctionUploader_1.Web3FunctionUploader.fetchSchema(TEST_CID);
            fail("W3F with no-schema fetched");
        }
        catch (error) {
            expect(error.message).toMatch("ENOENT");
        }
    }));
    test("fetching schema should fail for malformed schema file", () => __awaiter(void 0, void 0, void 0, function* () {
        mockUserApi
            .onGet(`${OPS_API_BASE}/users/web3-function/${TEST_CID}`)
            .reply(function () {
            return [
                200,
                node_fs_1.default.createReadStream(node_path_1.default.join(buildTestPath("malformed-schema-tar"), `${TEST_CID}.tgz`)),
            ];
        });
        try {
            yield Web3FunctionUploader_1.Web3FunctionUploader.fetchSchema(TEST_CID);
            fail("W3F with no-schema fetched");
        }
        catch (error) {
            expect(error.message).toMatch("Unexpected token");
        }
    }));
    test("fetched function data should be removed after fetching schema", () => __awaiter(void 0, void 0, void 0, function* () {
        mockUserApi
            .onGet(`${OPS_API_BASE}/users/web3-function/${TEST_CID}`)
            .reply(function () {
            return [
                200,
                node_fs_1.default.createReadStream(node_path_1.default.join(buildTestPath("valid-tar"), `${TEST_CID}.tgz`)),
            ];
        });
        const expectedPath = `.tmp/${TEST_CID}.tgz`;
        const schema = yield Web3FunctionUploader_1.Web3FunctionUploader.fetchSchema(TEST_CID);
        try {
            yield promises_1.default.access(node_path_1.default.join(process.cwd(), expectedPath));
            fail("Fetched W3F not removed after schema");
        }
        catch (error) {
            expect(error.message).toMatch("ENOENT");
        }
        expect(schema.web3FunctionVersion).toBeDefined();
    }));
    // Upload
    test("upload should return the CID of the W3F", () => __awaiter(void 0, void 0, void 0, function* () {
        const tempPath = yield prepareCompressTest("valid-tar");
        mockUserApi.onPost(`${OPS_API_BASE}/users/web3-function`).reply(200, JSON.stringify({
            cid: "my-cid",
        }));
        const cid = yield Web3FunctionUploader_1.Web3FunctionUploader.upload(node_path_1.default.join(tempPath, "schema.json"), node_path_1.default.join(tempPath, "index.js"), node_path_1.default.join(tempPath, "source.js"));
        expect(cid).toBe("my-cid");
        cleanupExtractTest("valid-tar");
    }));
});
