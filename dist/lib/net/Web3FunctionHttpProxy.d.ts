interface Web3FunctionHttpProxyStats {
    nbRequests: number;
    nbThrottled: number;
    download: number;
    upload: number;
}
export declare class Web3FunctionHttpProxy {
    private _debug;
    private _isStopped;
    private readonly _maxDownload;
    private readonly _maxUpload;
    private readonly _maxRequests;
    private _totalDownload;
    private _totalUpload;
    private _totalRequests;
    private _totalRequestsThrottled;
    private _server;
    constructor(maxDownloadSize: number, maxUploadSize: number, maxRequests: number, debug: boolean);
    private _handleServer;
    private _handleSecureServer;
    private _log;
    start(port?: number): void;
    stop(): void;
    getStats(): Web3FunctionHttpProxyStats;
}
export {};
