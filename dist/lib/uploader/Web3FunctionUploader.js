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
exports.Web3FunctionUploader = void 0;
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
const form_data_1 = __importDefault(require("form-data"));
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const tar_1 = __importDefault(require("tar"));
const OPS_USER_API = (_a = process.env.OPS_USER_API) !== null && _a !== void 0 ? _a : "https://api.gelato.digital/automate/users";
const DOWNLOAD_MAX_SIZE = 1 * 1024 * 1024; // 1 MB;
const EXTRACT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
class Web3FunctionUploader {
    static upload(schemaPath, filePath, sourcePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const compressedPath = yield this.compress(filePath, schemaPath, sourcePath);
                const cid = yield this._userApiUpload(compressedPath);
                return cid;
            }
            catch (err) {
                throw new Error(`Web3FunctionUploaderError: ${err.message}`);
            }
        });
    }
    static fetch(cid, destDir = node_path_1.default.join(process.cwd(), ".tmp")) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // abort download when it exceeds the limit
                const downloadAbort = new AbortController();
                const chunks = [];
                axios_1.default
                    .get(`${OPS_USER_API}/users/web3-function/${cid}`, {
                    responseType: "stream",
                    signal: downloadAbort.signal,
                })
                    .then((res) => {
                    const web3FunctionFileName = `${cid}.tgz`;
                    const web3FunctionPath = node_path_1.default.join(destDir, web3FunctionFileName);
                    let downloadedSize = 0;
                    res.data.on("data", (chunk) => {
                        downloadedSize += chunk.length;
                        if (downloadedSize >= DOWNLOAD_MAX_SIZE) {
                            downloadAbort.abort();
                        }
                        else {
                            chunks.push(chunk);
                        }
                    });
                    res.data.on("end", () => __awaiter(this, void 0, void 0, function* () {
                        const buffer = Buffer.concat(chunks);
                        if (!node_fs_1.default.existsSync(destDir)) {
                            node_fs_1.default.mkdirSync(destDir, { recursive: true });
                        }
                        yield promises_1.default.writeFile(web3FunctionPath, buffer);
                        resolve(web3FunctionPath);
                    }));
                    res.data.on("error", (err) => {
                        // handle download limit exceeding specifically
                        if (axios_1.default.isCancel(err)) {
                            reject(new Error(`file size is exceeding download limit ${DOWNLOAD_MAX_SIZE.toFixed(2)}mb`));
                        }
                        else {
                            reject(err);
                        }
                    });
                })
                    .catch((err) => {
                    var _a;
                    let errMsg = `${err.message} `;
                    if (axios_1.default.isAxiosError(err)) {
                        try {
                            const data = JSON.parse((_a = err.response) === null || _a === void 0 ? void 0 : _a.data.toString("utf8"));
                            if (data.message)
                                errMsg += data.message;
                        }
                        catch (err) {
                            errMsg += err.message;
                        }
                    }
                    reject(new Error(`Web3FunctionUploaderError: Fetch Web3Function ${cid} to ${destDir} failed. \n${errMsg}`));
                });
            });
        });
    }
    static compress(web3FunctionBuildPath, schemaPath, sourcePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield promises_1.default.access(web3FunctionBuildPath);
            }
            catch (err) {
                throw new Error(`Web3Function build file not found at path. ${web3FunctionBuildPath} \n${err.message}`);
            }
            // create directory with index.js, source.js & schema.json
            const folderCompressedName = `web3Function`;
            const folderCompressedPath = node_path_1.default.join(process.cwd(), ".tmp", folderCompressedName);
            const folderCompressedTar = `${folderCompressedPath}.tgz`;
            if (!node_fs_1.default.existsSync(folderCompressedPath)) {
                node_fs_1.default.mkdirSync(folderCompressedPath, { recursive: true });
            }
            // move files to directory
            yield promises_1.default.rename(web3FunctionBuildPath, node_path_1.default.join(folderCompressedPath, "index.js"));
            yield promises_1.default.rename(sourcePath, node_path_1.default.join(folderCompressedPath, "source.js"));
            try {
                yield promises_1.default.copyFile(schemaPath, node_path_1.default.join(folderCompressedPath, "schema.json"));
            }
            catch (err) {
                throw new Error(`Schema not found at path: ${schemaPath}. \n${err.message}`);
            }
            const stream = tar_1.default
                .c({
                gzip: true,
                cwd: node_path_1.default.join(process.cwd(), ".tmp"),
                noMtime: true,
                portable: true,
            }, [folderCompressedName])
                .pipe(node_fs_1.default.createWriteStream(folderCompressedTar));
            yield new Promise((fulfill) => {
                stream.once("finish", fulfill);
            });
            // delete directory after compression
            yield promises_1.default.rm(folderCompressedPath, { recursive: true });
            return folderCompressedTar;
        });
    }
    static extract(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const tarExpectedFileNames = ["schema.json", "index.js", "source.js"];
            try {
                const { dir, name } = node_path_1.default.parse(input);
                // rename directory to ipfs cid of web3Function if possible.
                const cidDirectory = node_path_1.default.join(dir, name);
                if (!node_fs_1.default.existsSync(cidDirectory)) {
                    node_fs_1.default.mkdirSync(cidDirectory, { recursive: true });
                }
                let extractedSize = 0;
                yield tar_1.default.x({
                    file: input,
                    cwd: cidDirectory,
                    filter: (_, entry) => {
                        extractedSize += entry.size;
                        if (extractedSize >= EXTRACT_MAX_SIZE) {
                            throw new Error(`extracted size exceeds max size ${EXTRACT_MAX_SIZE.toFixed(2)}mb`);
                        }
                        const fileName = entry.path.split("/").pop();
                        if (entry.type !== "File" ||
                            !tarExpectedFileNames.includes(fileName)) {
                            // Ignore unexpected files from archive
                            return false;
                        }
                        return true;
                    },
                });
                // remove tar file
                node_fs_1.default.rmSync(input, { recursive: true });
                // move web3Function & schema to root ipfs cid directory
                node_fs_1.default.renameSync(node_path_1.default.join(cidDirectory, "web3Function", "schema.json"), node_path_1.default.join(cidDirectory, "schema.json"));
                node_fs_1.default.renameSync(node_path_1.default.join(cidDirectory, "web3Function", "index.js"), node_path_1.default.join(cidDirectory, "index.js"));
                node_fs_1.default.renameSync(node_path_1.default.join(cidDirectory, "web3Function", "source.js"), node_path_1.default.join(cidDirectory, "source.js"));
                // remove web3Function directory
                node_fs_1.default.rmSync(node_path_1.default.join(cidDirectory, "web3Function"), {
                    recursive: true,
                });
                return {
                    dir: cidDirectory,
                    schemaPath: node_path_1.default.join(cidDirectory, "schema.json"),
                    sourcePath: node_path_1.default.join(cidDirectory, "source.js"),
                    web3FunctionPath: node_path_1.default.join(cidDirectory, "index.js"),
                };
            }
            catch (err) {
                throw new Error(`Web3FunctionUploaderError: Extract Web3Function from ${input} failed. \n${err.message}`);
            }
        });
    }
    static fetchSchema(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const web3FunctionPath = yield Web3FunctionUploader.fetch(cid);
                const { dir, schemaPath } = yield Web3FunctionUploader.extract(web3FunctionPath);
                const schema = JSON.parse(node_fs_1.default.readFileSync(schemaPath, "utf-8"));
                node_fs_1.default.rmSync(dir, { recursive: true });
                return schema;
            }
            catch (err) {
                throw new Error(`Web3FunctionUploaderError: Get schema of ${cid} failed: \n${err.message}`);
            }
        });
    }
    static _userApiUpload(compressedPath) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const form = new form_data_1.default();
                const file = node_fs_1.default.createReadStream(compressedPath);
                form.append("title", "Web3Function");
                form.append("file", file);
                const res = yield axios_1.default.post(`${OPS_USER_API}/users/web3-function`, form, Object.assign({}, form.getHeaders()));
                const cid = res.data.cid;
                // rename file with cid
                const { dir, ext } = node_path_1.default.parse(compressedPath);
                yield promises_1.default.rename(compressedPath, node_path_1.default.join(dir, `${cid}${ext}`));
                return cid;
            }
            catch (err) {
                let errMsg = `${err.message} `;
                if (axios_1.default.isAxiosError(err)) {
                    const data = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data;
                    if (data.message)
                        errMsg += data.message;
                }
                throw new Error(`Upload to User api failed. \n${errMsg}`);
            }
        });
    }
}
exports.Web3FunctionUploader = Web3FunctionUploader;
