/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Web3FunctionHttpClient extends EventEmitter {
    private _debug;
    private _host;
    private _port;
    private _mountPath;
    private _isStopped;
    constructor(host: string, port: number, mountPath: string, debug?: boolean);
    connect(timeout: number): Promise<void>;
    private _safeSend;
    private _send;
    private _log;
    end(): void;
}
