/// <reference types="node" />
import { EventEmitter } from "events";
import { Web3FunctionVersion } from "../../types";
import { Web3FunctionSandboxOptions } from "../types";
export declare abstract class Web3FunctionAbstractSandbox extends EventEmitter {
    protected _memoryLimit: number;
    protected _isStopped: boolean;
    protected _processExitCodePromise: Promise<number>;
    protected _showStdout: boolean;
    protected _debug: boolean;
    protected _logs: string[];
    constructor(options: Web3FunctionSandboxOptions, showStdout?: boolean, debug?: boolean);
    stop(): Promise<void>;
    protected abstract _stop(): Promise<void>;
    protected abstract _start(script: string, version: Web3FunctionVersion, serverPort: number, mountPath: string, httpProxyPort: number, args: string[]): Promise<void>;
    protected abstract _getMemoryUsage(): Promise<number>;
    start(script: string, version: Web3FunctionVersion, serverPort: number, mountPath: string, httpProxyPort: number, blacklistedHosts?: string[]): Promise<void>;
    getMemoryUsage(): Promise<number>;
    getLogs(): string[];
    protected _onStdoutData(data: string): void;
    waitForProcessEnd(): Promise<number>;
    protected _log(message: string): void;
}
