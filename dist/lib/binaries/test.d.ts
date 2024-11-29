import { Log } from "@ethersproject/providers";
import { MultiChainProviderConfig } from "../provider";
import { Web3FunctionOperation, Web3FunctionUserArgs } from "../types";
export interface CallConfig {
    operation: Web3FunctionOperation;
    w3fPath: string;
    debug: boolean;
    showLogs: boolean;
    runtime: RunTime;
    userArgs: Web3FunctionUserArgs;
    storage: {
        [key: string]: string;
    };
    secrets: {
        [key: string]: string;
    };
    multiChainProviderConfig: MultiChainProviderConfig;
    chainId: number;
    log?: Log;
    rpcLimit: number;
    requestLimit: number;
    downloadLimit: number;
    uploadLimit: number;
    storageLimit: number;
}
export declare type RunTime = "docker" | "thread";
export default function test(callConfig?: Partial<CallConfig>): Promise<void>;
