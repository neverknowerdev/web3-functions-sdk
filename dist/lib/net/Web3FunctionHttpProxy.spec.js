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
const axios_1 = __importDefault(require("axios"));
const http_1 = __importDefault(require("http"));
const Web3FunctionHttpProxy_1 = require("./Web3FunctionHttpProxy");
const MAX_DOWNLOAD_SIZE = 1 * 1024;
const MAX_UPLOAD_SIZE = 1 * 1024;
const MAX_REQUESTS = 2;
const limitPayload = `07687025835896630850868449444515\n
                19004885209543960311432986080541\n
                03158281758729558593090926184825\n
                40772319890392416463798330135022\n
                07702013838043904240082977642434\n
                78566525722876389716880511958995\n
                12035921191774613938722741086776\n
                50288953712326350078906469208225\n
                58479170878046405538264425626156\n
                20466941989979842517387202418765\n
                30898445718944664974752192926478\n
                10829190843006647792462329496676\n
                69172422122281182915998920830447\n
                68159615670566716041444574158276\n
                60694522988055341504065499436440\n
                78154146011219258273400776799336\n
                54545430660844152600367106532410\n
                03483614367103665993033133233507\n
                97294966024323840999755783241680\n
                82279112196345575379498270220001\n
                82279112196345575379498270220001\n
                82279112196345575379498270220001\n
                `;
describe("Web3FunctionHttpProxy", () => {
    let httpProxy;
    let testServer;
    beforeAll(() => {
        axios_1.default.defaults.proxy = {
            host: "localhost",
            port: 3000,
            protocol: "http:",
        };
        // Create an HTTP server
        testServer = http_1.default.createServer((req, res) => {
            var _a, _b;
            // Set the response header with a 200 OK status and plain text content type
            res.writeHead(200, { "Content-Type": "text/plain" });
            if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.includes("limit")) {
                res.end(limitPayload);
            }
            else if ((_b = req.url) === null || _b === void 0 ? void 0 : _b.includes("query")) {
                res.end("Query parameters received");
            }
            else {
                // Write the response body
                res.end("Hello, World!\n");
            }
        });
        // Listen on port 3000 (you can choose any available port)
        const port = 8001;
        testServer.listen(port);
    });
    afterAll(() => {
        testServer.close();
    });
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        httpProxy = new Web3FunctionHttpProxy_1.Web3FunctionHttpProxy(MAX_DOWNLOAD_SIZE, MAX_UPLOAD_SIZE, MAX_REQUESTS, false);
        yield httpProxy.start();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        httpProxy.stop();
    }));
    test("should respond HTTP:429 when request limit exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield axios_1.default.get("http://localhost:8001");
            yield axios_1.default.get("http://localhost:8001");
            yield axios_1.default.get("http://localhost:8001");
        }
        catch (error) {
            if (error.response) {
                expect(error.response.status).toEqual(429);
                return;
            }
        }
        throw new Error(`HTTP: Request limit exceeded`);
    }));
    test("should forward requests", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield axios_1.default.get("http://localhost:8001/hello");
        expect(res.data).toEqual("Hello, World!\n");
    }));
    test("should forward query parameters", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield axios_1.default.get("http://localhost:8001/test?query=true");
        expect(res.data).toEqual("Query parameters received");
    }));
    test("should break connection on download limit exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield axios_1.default.get("http://localhost:8001/limit");
        }
        catch (error) {
            expect(error.code).toEqual("ECONNRESET");
            return;
        }
        throw new Error(`HTTP: download limit exceeded`);
    }));
    test("should break connection on upload limit exceed", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield axios_1.default.post("http://localhost:8001", limitPayload);
        }
        catch (error) {
            expect(error.code).toEqual("ECONNRESET");
            return;
        }
        throw new Error(`HTTP: upload limit exceeded`);
    }));
});
