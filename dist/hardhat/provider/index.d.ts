import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";
import { MultiChainProviderConfig } from "../../lib/provider";
export declare function getMultiChainProviderConfigs(hre: HardhatRuntimeEnvironment): Promise<MultiChainProviderConfig>;
export declare class EthersProviderWrapper extends StaticJsonRpcProvider {
    private readonly _hardhatProvider;
    constructor(hardhatProvider: EthereumProvider);
    send(method: string, params: any): Promise<any>;
}
