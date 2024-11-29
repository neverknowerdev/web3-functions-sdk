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
const express_1 = __importDefault(require("express"));
const Web3FunctionHttpClient_1 = require("./Web3FunctionHttpClient");
const TEST_PORT = 3500;
describe("Web3FunctionHttpClient", () => {
    let invalidClient;
    let client;
    let simpleServer;
    let expressServer;
    const startListening = () => {
        expressServer = simpleServer.listen(TEST_PORT);
    };
    beforeAll(() => {
        simpleServer = (0, express_1.default)();
        simpleServer.use(express_1.default.json());
        simpleServer.get("/valid", (req, res) => {
            res.sendStatus(200);
        });
        simpleServer.post("/valid", (req, res) => {
            const data = req.body;
            if (data.data.malformed) {
                res.json({ malformed: true });
            }
            else {
                res.send(JSON.stringify({
                    action: "error",
                    data: {
                        error: {
                            name: "Just testing",
                            message: `Just testing`,
                        },
                        storage: {
                            state: "last",
                            storage: {},
                            diff: {},
                        },
                    },
                }));
            }
        });
        startListening();
        invalidClient = new Web3FunctionHttpClient_1.Web3FunctionHttpClient("http://localhost", TEST_PORT, "invalid");
        client = new Web3FunctionHttpClient_1.Web3FunctionHttpClient("http://localhost", TEST_PORT, "valid", false);
    });
    test("should timeout connection if not accessible", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect(() => invalidClient.connect(100)).rejects.toThrowError("Web3FunctionHttpClient unable to connect");
    }));
    test("should disconnect while stopped during connection", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect(() => Promise.all([client.connect(100), client.end()])).rejects.toThrowError("Disconnected");
    }));
    test("should error out when connection is lost during send", (done) => {
        client.emit("input_event", { action: "start", data: {} });
        expressServer.close();
        const errorHandler = (error) => {
            expect(error.message).toMatch("Web3FunctionHttpClient request error");
            startListening();
            client.off("error", errorHandler);
            done();
        };
        client.on("error", errorHandler);
    });
    test("should send and receive web3function events", (done) => {
        client.emit("input_event", { action: "start", data: {} });
        client.on("output_event", (event) => {
            expect(event.action).toBe("error");
            if (event.action === "error") {
                expect(event.data.error.message).toMatch("Just testing");
            }
            done();
        });
    });
});
