/* tslint:disable */
/* eslint-disable */
/**
* @param {number} sender
* @param {number} address
* @param {any} funds
* @param {any} extension
* @param {Uint8Array} code
* @param {any} message
* @returns {any}
*/
export function vm_instantiate(sender: number, address: number, funds: any, extension: any, code: Uint8Array, message: any): any;
/**
* @param {number} sender
* @param {number} address
* @param {any} funds
* @param {any} extension
* @param {Uint8Array} code
* @param {any} message
* @returns {any}
*/
export function vm_execute(sender: number, address: number, funds: any, extension: any, code: Uint8Array, message: any): any;
/**
* @param {number} sender
* @param {number} address
* @param {any} funds
* @param {any} extension
* @param {Uint8Array} code
* @param {any} message
* @returns {any}
*/
export function vm_query(sender: number, address: number, funds: any, extension: any, code: Uint8Array, message: any): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly vm_instantiate: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly vm_execute: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly vm_query: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
