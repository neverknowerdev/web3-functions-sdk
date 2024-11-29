import { Web3FunctionSchema } from "../types";
export declare type Web3FunctionBuildResult = {
    success: true;
    filePath: string;
    sourcePath: string;
    schemaPath: string;
    fileSize: number;
    buildTime: number;
    schema: Web3FunctionSchema;
} | {
    success: false;
    error: Error;
};
export declare class Web3FunctionBuilder {
    /**
     * Helper function to build and publish Web3Function to IPFS
     *
     * @param input web3FunctionFilePath
     * @returns string CID: Web3Function IPFS hash
     */
    static deploy(input: string): Promise<string>;
    private static _buildBundle;
    private static _buildSource;
    private static _validateSchema;
    static build(input: string, options?: {
        debug?: boolean;
        filePath?: string;
        sourcePath?: string;
        alias?: Record<string, string>;
    }): Promise<Web3FunctionBuildResult>;
}
