import { Web3FunctionEvent } from "../types/Web3FunctionEvent";
export declare class Web3FunctionHttpServer {
    private _eventHandler;
    private _waitConnectionReleased;
    private _debug;
    constructor(port: number, mountPath: string, debug: boolean, eventHandler: (event: Web3FunctionEvent) => Promise<Web3FunctionEvent>);
    private _setupConnection;
    private _onRequest;
    private _isValidMountPath;
    private _log;
    waitConnectionReleased(): Promise<void>;
}
