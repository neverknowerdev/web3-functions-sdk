import { Web3FunctionOperation } from "../types";
import { Web3FunctionExec, Web3FunctionRunnerPayload } from "./types";
export declare class Web3FunctionRunnerPool {
    private _poolSize;
    private _queuedRunners;
    private _activeRunners;
    private _debug;
    private _tcpPortsAvailable;
    constructor(poolSize?: number, debug?: boolean);
    init(): Promise<void>;
    run<T extends Web3FunctionOperation>(operation: T, payload: Web3FunctionRunnerPayload<T>): Promise<Web3FunctionExec<T>>;
    private _enqueueAndWait;
    private _processNext;
    private _log;
}
