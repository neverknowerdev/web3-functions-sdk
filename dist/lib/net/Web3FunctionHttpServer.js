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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3FunctionHttpServer = void 0;
class Web3FunctionHttpServer {
    constructor(port, mountPath, debug, eventHandler) {
        this._waitConnectionReleased = Promise.resolve();
        this._debug = debug;
        this._eventHandler = eventHandler;
        this._setupConnection(port, mountPath);
    }
    _setupConnection(port, mountPath) {
        var e_1, _a, e_2, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const conns = Deno.listen({ port, hostname: "0.0.0.0" });
            this._log(`Listening on http://${conns.addr.hostname}:${conns.addr.port}`);
            try {
                for (var conns_1 = __asyncValues(conns), conns_1_1; conns_1_1 = yield conns_1.next(), !conns_1_1.done;) {
                    const conn = conns_1_1.value;
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        let connectionReleaseResolver = () => {
                            // Intentionally left empty to use as variable
                        };
                        this._waitConnectionReleased = new Promise((resolve) => {
                            connectionReleaseResolver = () => {
                                resolve();
                            };
                        });
                        try {
                            for (var _c = (e_2 = void 0, __asyncValues(Deno.serveHttp(conn))), _d; _d = yield _c.next(), !_d.done;) {
                                const e = _d.value;
                                try {
                                    const res = yield this._onRequest(e.request, mountPath);
                                    yield e.respondWith(res);
                                }
                                catch (err) {
                                    this._log(`Request Error: ${err.message}`);
                                    yield e.respondWith(new Response(`Internal error: ${err.message}`, { status: 500 }));
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_b = _c.return)) yield _b.call(_c);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        connectionReleaseResolver();
                    }
                    catch (err) {
                        this._log(`Connection Error: ${err.message}`);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (conns_1_1 && !conns_1_1.done && (_a = conns_1.return)) yield _a.call(conns_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    _onRequest(req, mountPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._isValidMountPath(req, mountPath)) {
                return new Response("invalid path", { status: 400 });
            }
            switch (req.method) {
                case "GET":
                    return new Response("ok");
                case "POST": {
                    const event = (yield req.json());
                    const res = yield this._eventHandler(event);
                    return new Response(JSON.stringify(res));
                }
                default:
                    return new Response(`unsupported method: ${req.method}`, {
                        status: 500,
                    });
            }
        });
    }
    _isValidMountPath(req, mountPath) {
        const { pathname } = new URL(req.url);
        if (pathname === `/${mountPath}`)
            return true;
        return false;
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionHttpServer: ${message}`);
    }
    waitConnectionReleased() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._waitConnectionReleased;
        });
    }
}
exports.Web3FunctionHttpServer = Web3FunctionHttpServer;
