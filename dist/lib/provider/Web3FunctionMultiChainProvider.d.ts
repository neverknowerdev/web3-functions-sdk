import { StaticJsonRpcProvider } from "@ethersproject/providers";
export declare class Web3FunctionMultiChainProvider {
    private _proxyRpcUrlBase;
    private _rateLimitCallback;
    private _providers;
    private _defaultProvider;
    constructor(proxyRpcUrlBase: string, defaultChainId: number, rateLimitCallBack: () => void);
    default(): StaticJsonRpcProvider;
    chainId(chainId: number): StaticJsonRpcProvider;
    nbRpcCallsRemaining(): Promise<any>;
    private _getProviderOfChainId;
    private _subscribeProviderEvents;
}
