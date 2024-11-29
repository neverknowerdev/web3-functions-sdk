export declare type Web3FunctionResult = Web3FunctionResultV1 | Web3FunctionResultV2;
export declare type Web3FunctionResultV1 = {
    canExec: true;
    callData: string;
} | {
    canExec: false;
    message: string;
};
export declare type Web3FunctionResultV2 = {
    canExec: true;
    callData: Web3FunctionResultCallData[];
} | {
    canExec: false;
    message: string;
};
export declare type Web3FunctionResultCallData = {
    to: string;
    data: string;
    value?: string;
};
