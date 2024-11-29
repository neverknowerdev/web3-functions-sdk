import "dotenv/config";
import { Web3FunctionSchema } from "../types";
export declare class Web3FunctionUploader {
    static upload(schemaPath: string, filePath: string, sourcePath: string): Promise<string>;
    static fetch(cid: string, destDir?: string): Promise<string>;
    static compress(web3FunctionBuildPath: string, schemaPath: string, sourcePath: string): Promise<string>;
    static extract(input: string): Promise<{
        dir: string;
        schemaPath: string;
        sourcePath: string;
        web3FunctionPath: string;
    }>;
    static fetchSchema(cid: string): Promise<Web3FunctionSchema>;
    private static _userApiUpload;
}
