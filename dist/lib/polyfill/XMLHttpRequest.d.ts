/**
 * @dev this file is imported from https://github.com/kitsonk/xhr
 * with all deno/std dependencies bundled in this file
 * */
/// <reference types="node" />
/** A map of extensions for a given media type. */
export declare const extensions: Map<string, string[]>;
export declare function consumeToken(v: string): [token: string, rest: string];
export declare function consumeValue(v: string): [value: string, rest: string];
export declare function consumeMediaParam(v: string): [key: string, value: string, rest: string];
export declare function decode2331Encoding(v: string): string | undefined;
export declare function isIterator<T>(obj: unknown): obj is Iterable<T>;
export declare function isToken(s: string): boolean;
export declare function needsEncoding(s: string): boolean;
export declare function getCharset(type: string): string | undefined;
export declare function typeByExtension(extension: string): string | undefined;
export declare function formatMediaType(type: string, param?: Record<string, string> | Iterable<[string, string]>): string;
export declare function contentType<T>(extensionOrType: any): string | undefined;
declare type XMLHttpRequestResponseType = "" | "arraybuffer" | "blob" | "document" | "json" | "text";
export declare class XMLHttpRequestEventTarget extends EventTarget {
    onabort: ((this: XMLHttpRequest, ev: any) => any) | null;
    onerror: ((this: XMLHttpRequest, ev: any) => any) | null;
    onload: ((this: XMLHttpRequest, ev: any) => any) | null;
    onloadend: ((this: XMLHttpRequest, ev: any) => any) | null;
    onloadstart: ((this: XMLHttpRequest, ev: any) => any) | null;
    onprogress: ((this: XMLHttpRequest, ev: any) => any) | null;
    ontimeout: ((this: XMLHttpRequest, ev: any) => any) | null;
    dispatchEvent(evt: any): boolean;
}
export declare class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
}
declare enum State {
    UNSENT = 0,
    OPENED = 1,
    HEADERS_RECEIVED = 2,
    LOADING = 3,
    DONE = 4
}
export declare class XMLHttpRequest extends XMLHttpRequestEventTarget {
    #private;
    onreadystatechange: ((this: XMLHttpRequest, ev: any) => any) | null;
    get readyState(): number;
    get response(): any;
    get responseText(): string;
    get responseType(): XMLHttpRequestResponseType;
    set responseType(value: XMLHttpRequestResponseType);
    get responseURL(): string;
    get responseXML(): null;
    get status(): number;
    get statusText(): string;
    get timeout(): number;
    set timeout(value: number);
    get upload(): XMLHttpRequestUpload;
    get withCredentials(): boolean;
    set withCredentials(value: boolean);
    abort(): void;
    dispatchEvent(evt: any): boolean;
    getAllResponseHeaders(): string | null;
    getResponseHeader(name: string): string | null;
    open(method: string, url: string, async?: boolean, username?: string | null, password?: string | null): void;
    overrideMimeType(mime: string): void;
    send(body?: any | null): void;
    setRequestHeader(name: string, value: string): void;
    get DONE(): State;
    get HEADERS_RECEIVED(): State;
    get LOADING(): State;
    get OPENED(): State;
    get UNSENT(): State;
    static get DONE(): State;
    static get HEADERS_RECEIVED(): State;
    static get LOADING(): State;
    static get OPENED(): State;
    static get UNSENT(): State;
}
export {};
