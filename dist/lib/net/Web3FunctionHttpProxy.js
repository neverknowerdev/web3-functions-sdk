"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3FunctionHttpProxy = void 0;
const http_1 = __importDefault(require("http"));
const net_1 = __importDefault(require("net"));
class Web3FunctionHttpProxy {
    constructor(maxDownloadSize, maxUploadSize, maxRequests, debug) {
        this._isStopped = true;
        this._totalDownload = 0;
        this._totalUpload = 0;
        this._totalRequests = 0;
        this._totalRequestsThrottled = 0;
        this._debug = debug;
        this._maxDownload = maxDownloadSize;
        this._maxUpload = maxUploadSize;
        this._maxRequests = maxRequests;
        this._server = http_1.default.createServer(this._handleServer.bind(this));
        this._server.on("connect", this._handleSecureServer.bind(this));
    }
    _handleServer(req, res) {
        if (req.url === undefined) {
            this._log("Request doesn't include any URL");
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad request");
            this._log(`Bad request received with no URL`);
            return;
        }
        if (this._totalRequests++ >= this._maxRequests) {
            res.writeHead(429, { "Content-Type": "text/plain" });
            res.end("Too many requests");
            this._log("Request limit exceeded");
            this._totalRequestsThrottled++;
            return;
        }
        try {
            const reqUrl = new URL(req.url);
            this._log(`Request url is proxied: ${req.url}`);
            const options = {
                hostname: reqUrl.hostname,
                port: reqUrl.port,
                path: reqUrl.pathname + reqUrl.search,
                method: req.method,
                headers: req.headers,
            };
            const serverConnection = http_1.default.request(options, (serverRes) => {
                var _a;
                serverRes.on("data", (chunk) => {
                    this._totalDownload += chunk.length;
                    if (this._totalDownload >= this._maxDownload) {
                        this._log("Download limit exceeded");
                        serverConnection.destroy();
                        res.destroy();
                        this._totalRequestsThrottled++;
                    }
                });
                res.writeHead((_a = serverRes.statusCode) !== null && _a !== void 0 ? _a : 200, serverRes.headers);
                serverRes.pipe(res);
            });
            req.on("data", (chunk) => {
                this._totalUpload += chunk.length;
                if (this._totalUpload >= this._maxUpload) {
                    this._log("Upload limit exceeded");
                    this._totalRequestsThrottled++;
                    req.destroy();
                }
            });
            req.pipe(serverConnection);
            req.on("error", (err) => {
                this._log(`Connection error to W3F runner: ${err.message}`);
            });
            serverConnection.on("error", (err) => {
                this._log(`Connection error to target: ${err.message}`);
            });
        }
        catch (err) {
            this._log(`Error during handling proxy: ${err.message}`);
            return;
        }
    }
    _handleSecureServer(req, socket, head) {
        if (req.url === undefined) {
            this._log("Request doesn't include any URL");
            socket.end();
            return;
        }
        if (this._totalRequests++ >= this._maxRequests) {
            this._log("Request limit exceeded");
            socket.end();
            this._totalRequestsThrottled++;
            return;
        }
        try {
            const reqUrl = new URL(`https://${req.url}`);
            this._log(`Secure request url is proxied: ${reqUrl.toString()}`);
            const options = {
                port: reqUrl.port === "" ? 443 : parseInt(reqUrl.port),
                host: reqUrl.hostname,
            };
            const serverSocket = net_1.default.connect(options, () => {
                socket.write(`HTTP/${req.httpVersion} 200 Connection Established\r\nProxy-Agent: Gelato-W3F-Proxy\r\n\r\n`, "utf-8", () => {
                    serverSocket.write(head);
                    serverSocket.pipe(socket);
                    socket.pipe(serverSocket);
                });
            });
            serverSocket.on("data", (data) => {
                this._totalDownload += data.length;
                if (this._totalDownload > this._maxDownload) {
                    this._log("Download limit exceeded");
                    req.destroy();
                    serverSocket.destroy();
                    this._totalRequestsThrottled++;
                }
            });
            socket.on("data", (data) => {
                this._totalUpload += data.length;
                if (this._totalUpload >= this._maxUpload) {
                    this._log("Upload limit exceeded");
                    req.destroy();
                    serverSocket.destroy();
                    this._totalRequestsThrottled++;
                }
            });
            socket.on("error", (err) => {
                this._log(`Socket error to W3F runner: ${err.message}`);
                serverSocket.end();
            });
            serverSocket.on("error", (err) => {
                this._log(`Socket error to target: ${err.message}`);
                socket.end();
            });
        }
        catch (err) {
            this._log(`Error during handling HTTPs proxy: ${err.message}`);
        }
    }
    _log(message) {
        if (this._debug)
            console.log(`Web3FunctionHttpProxy: ${message}`);
    }
    start(port = 3000) {
        this._server
            .listen(port, () => {
            this._log(`Started listening on ${port}`);
            this._isStopped = false;
        })
            .on("error", (err) => {
            this._log(`Proxy server cannot be started: ${err}`);
            this.stop();
        });
    }
    stop() {
        if (!this._isStopped) {
            this._isStopped = true;
            if (this._server)
                this._server.close();
        }
    }
    getStats() {
        return {
            nbRequests: this._totalRequests,
            nbThrottled: this._totalRequestsThrottled,
            download: this._totalDownload / 1024,
            upload: this._totalUpload / 1024,
        };
    }
}
exports.Web3FunctionHttpProxy = Web3FunctionHttpProxy;
