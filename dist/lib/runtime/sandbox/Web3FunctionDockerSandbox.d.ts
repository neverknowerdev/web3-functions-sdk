import { Web3FunctionVersion } from "../../types";
import { Web3FunctionAbstractSandbox } from "./Web3FunctionAbstractSandbox";
export declare class Web3FunctionDockerSandbox extends Web3FunctionAbstractSandbox {
    private _container?;
    private _docker;
    private _denoImage;
    protected _stop(): Promise<void>;
    protected _createImageIfMissing(image: string): Promise<void>;
    protected _start(script: string, version: Web3FunctionVersion, serverPort: number, mountPath: string, httpProxyPort: number, args: string[]): Promise<void>;
    protected _getMemoryUsage(): Promise<number>;
}
