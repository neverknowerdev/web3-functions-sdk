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
exports.Web3FunctionBuilder = void 0;
const ajv_1 = __importDefault(require("ajv"));
const esbuild_1 = __importDefault(require("esbuild"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const perf_hooks_1 = require("perf_hooks");
const uploader_1 = require("../uploader");
const version_1 = require("../version");
const web3function_schema_json_1 = __importDefault(require("./web3function.schema.json"));
const ajv = new ajv_1.default({ messages: true, allErrors: true });
const web3FunctionSchemaValidator = ajv.compile(web3function_schema_json_1.default);
class Web3FunctionBuilder {
    /**
     * Helper function to build and publish Web3Function to IPFS
     *
     * @param input web3FunctionFilePath
     * @returns string CID: Web3Function IPFS hash
     */
    static deploy(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const buildRes = yield Web3FunctionBuilder.build(input);
            if (!buildRes.success)
                throw buildRes.error;
            return yield uploader_1.Web3FunctionUploader.upload(buildRes.schemaPath, buildRes.filePath, buildRes.sourcePath);
        });
    }
    static _buildBundle(input, outfile, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            // Build & bundle web3Function
            const options = {
                bundle: true,
                entryPoints: [input],
                absWorkingDir: process.cwd(),
                platform: "browser",
                target: "es2022",
                format: "esm",
                minify: true,
                inject: [node_path_1.default.join(__dirname, "../polyfill/XMLHttpRequest.js")],
                alias,
                outfile,
            };
            yield esbuild_1.default.build(options);
        });
    }
    static _buildSource(input, outfile, alias) {
        return __awaiter(this, void 0, void 0, function* () {
            // Build & bundle js source file
            const options = {
                bundle: true,
                entryPoints: [input],
                absWorkingDir: process.cwd(),
                packages: "external",
                target: "es2022",
                platform: "browser",
                format: "esm",
                alias,
                outfile,
            };
            yield esbuild_1.default.build(options);
        });
    }
    static _validateSchema(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasSchema = node_fs_1.default.existsSync(input);
            if (!hasSchema) {
                throw new Error(`Web3FunctionSchemaError: Missing Web3Function schema at '${input}'
Please create 'schema.json', default: 
{
  "web3FunctionVersion": "2.0.0",
  "runtime": "js-1.0",
  "memory": 128,
  "timeout": 30,
  "userArgs": {}
}`);
            }
            let schemaContent;
            try {
                schemaContent = node_fs_1.default.readFileSync(input).toString();
            }
            catch (err) {
                throw new Error(`Web3FunctionSchemaError: Unable to read Web3Function schema at '${input}', ${err.message}`);
            }
            let schemaBody;
            try {
                schemaBody = JSON.parse(schemaContent);
            }
            catch (err) {
                throw new Error(`Web3FunctionSchemaError: Invalid json schema at '${input}', ${err.message}`);
            }
            const res = web3FunctionSchemaValidator(schemaBody);
            if (!res) {
                let errorParts = "";
                if (web3FunctionSchemaValidator.errors) {
                    errorParts = web3FunctionSchemaValidator.errors
                        .map((validationErr) => {
                        let msg = `\n - `;
                        if (validationErr.instancePath === "/web3FunctionVersion") {
                            msg += `'web3FunctionVersion' must match the major version of the installed sdk (${version_1.SDK_VERSION})`;
                            if (validationErr.params.allowedValues) {
                                msg += ` [${validationErr.params.allowedValues.join("|")}]`;
                            }
                            return msg;
                        }
                        else if (validationErr.instancePath) {
                            msg += `'${validationErr.instancePath
                                .replace("/", ".")
                                .substring(1)}' `;
                        }
                        msg += `${validationErr.message}`;
                        if (validationErr.params.allowedValues) {
                            msg += ` [${validationErr.params.allowedValues.join("|")}]`;
                        }
                        return msg;
                    })
                        .join();
                }
                throw new Error(`Web3FunctionSchemaError: invalid ${input} ${errorParts}`);
            }
            return schemaBody;
        });
    }
    static build(input, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { debug = false, filePath = node_path_1.default.join(process.cwd(), ".tmp", "index.js"), sourcePath = node_path_1.default.join(process.cwd(), ".tmp", "source.js"), alias, } = options !== null && options !== void 0 ? options : {};
            try {
                const schemaPath = node_path_1.default.join(node_path_1.default.parse(input).dir, "schema.json");
                const schema = yield Web3FunctionBuilder._validateSchema(schemaPath);
                const start = perf_hooks_1.performance.now();
                yield Promise.all([
                    Web3FunctionBuilder._buildBundle(input, filePath, alias),
                    Web3FunctionBuilder._buildSource(input, sourcePath, alias),
                ]);
                const buildTime = perf_hooks_1.performance.now() - start; // in ms
                const stats = node_fs_1.default.statSync(filePath);
                const fileSize = stats.size / 1024 / 1024; // size in mb
                return {
                    success: true,
                    schemaPath,
                    sourcePath,
                    filePath,
                    fileSize,
                    buildTime,
                    schema,
                };
            }
            catch (err) {
                if (debug)
                    console.error(err);
                return {
                    success: false,
                    error: err,
                };
            }
        });
    }
}
exports.Web3FunctionBuilder = Web3FunctionBuilder;
