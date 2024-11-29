import { W3fDetails } from "./types";
export declare class Web3FunctionLoader {
    private static _cache;
    private static _loadJson;
    private static _loadLog;
    private static _loadSecrets;
    static load(w3fName: string, w3fRootDir: string): W3fDetails;
}
