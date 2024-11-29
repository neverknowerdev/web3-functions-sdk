import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Log } from "@ethersproject/providers";
import { Web3FunctionOperation, Web3FunctionUserArgs } from "../../lib";
import { W3fDetails } from "../../lib/loader";
import { Web3FunctionExecSuccess } from "../../lib/runtime";
export declare class W3fHardhatPlugin {
    private hre;
    constructor(_hre: HardhatRuntimeEnvironment);
    get(_name: string): Web3FunctionHardhat;
}
export declare class Web3FunctionHardhat {
    private w3f;
    private hre;
    private provider;
    constructor(_hre: HardhatRuntimeEnvironment, _w3f: W3fDetails);
    run<T extends Web3FunctionOperation>(operation: T, override?: {
        storage?: {
            [key: string]: string;
        };
        userArgs?: Web3FunctionUserArgs;
        log?: Log;
    }): Promise<Web3FunctionExecSuccess<T>>;
    deploy(): Promise<string>;
    getGelatoArgs(gasPriceOverride?: string): Promise<{
        blockTime: number;
        chainId: number;
        gasPrice: string;
    }>;
    getSecrets(): {
        [key: string]: string;
    };
    getUserArgs(): Web3FunctionUserArgs;
    getStorage(): {
        [key: string]: string;
    };
    getPath(): string;
}
