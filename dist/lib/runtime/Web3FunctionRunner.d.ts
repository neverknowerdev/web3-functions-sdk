import { Web3FunctionOperation, Web3FunctionUserArgs, Web3FunctionUserArgsSchema } from "../types";
import { Web3FunctionExec, Web3FunctionRunnerPayload } from "./types";
export declare class Web3FunctionRunner {
    private _debug;
    private _memory;
    private _portsOccupied;
    private _proxyProvider?;
    private _httpProxy?;
    private _client?;
    private _sandbox?;
    private _startupTime;
    private _execTimeoutId?;
    private _memoryIntervalId?;
    private _exitRemover;
    constructor(debug?: boolean, portsOccupied?: number[]);
    validateUserArgs(userArgsSchema: Web3FunctionUserArgsSchema, userArgs: Web3FunctionUserArgs): void;
    private _getInvalidParseExample;
    parseUserArgs(userArgsSchema: Web3FunctionUserArgsSchema, inputUserArgs: {
        [key: string]: string;
    }): Web3FunctionUserArgs;
    run<T extends Web3FunctionOperation>(operation: T, payload: Web3FunctionRunnerPayload<T>): Promise<Web3FunctionExec<T>>;
    private _createSandbox;
    private _getSandboxExitReason;
    private _runInSandbox;
    private _monitorMemoryUsage;
    private _throwError;
    private _isValidData;
    private _validateResultV1;
    private _validateResultV2;
    private _validateResult;
    stop(): Promise<void>;
    private _log;
}
