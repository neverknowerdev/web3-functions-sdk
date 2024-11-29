import { BaseRunHandler, EventRunHandler, FailHandler, SuccessHandler } from "./types/Web3FunctionHandler";
export declare class Web3Function {
    private static Instance?;
    private static _debug;
    private _server;
    private _onRun?;
    private _onSuccess?;
    private _onFail?;
    constructor();
    private _onFunctionEvent;
    private _invokeOnRun;
    private _invokeOnFail;
    private _invokeOnSuccess;
    private _context;
    private _compareStorage;
    private _exit;
    static getInstance(): Web3Function;
    static onRun(onRun: BaseRunHandler): void;
    static onRun(onRun: EventRunHandler): void;
    static onSuccess(onSuccess: SuccessHandler): void;
    static onFail(onFail: FailHandler): void;
    static setDebug(debug: boolean): void;
    private static _log;
    private _onRpcRateLimit;
    private _initProvider;
}
