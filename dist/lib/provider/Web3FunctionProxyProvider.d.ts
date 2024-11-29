import express from "express";
import { MultiChainProviderConfig } from "./types";
export declare class Web3FunctionProxyProvider {
    private _debug;
    private _host;
    private _mountPath;
    private _proxyUrl;
    private _app;
    private _server;
    private _isStopped;
    private _nbRpcCalls;
    private _nbThrottledRpcCalls;
    private _limit;
    private _whitelistedMethods;
    private _providers;
    private _mainChainId;
    constructor(host: string, limit: number, mainChainId: number, multiChainProviderConfig: MultiChainProviderConfig, debug?: boolean);
    protected _checkRateLimit(): Promise<void>;
    protected _requestHandler(req: express.Request, res: express.Response): Promise<void>;
    private _instantiateProvider;
    start(port?: number): Promise<void>;
    getNbRpcCalls(): {
        total: number;
        throttled: number;
    };
    getProxyUrl(): string;
    private _log;
    stop(): void;
}
