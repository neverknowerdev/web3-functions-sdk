import { Web3FunctionVersion } from "../../types";
import { Web3FunctionAbstractSandbox } from "./Web3FunctionAbstractSandbox";
export declare class Web3FunctionThreadSandbox extends Web3FunctionAbstractSandbox {
    private _thread?;
    protected _stop(): Promise<void>;
    protected _start(script: string, version: Web3FunctionVersion, serverPort: number, mountPath: string, httpProxyPort: number, args: string[]): Promise<void>;
    protected _getMemoryUsage(): Promise<number>;
}
