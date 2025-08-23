import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export interface Transaction {
  amount: i128;
  cancelled: boolean;
  description: string;
  id: u64;
  itemized_list: string;
  merchant_location: string;
  merchant_name: string;
  paid: boolean;
  payer: Option<string>;
  requested_token_contract: string;
  timestamp: u64;
}

export const Err = {
  1: {message:"NotOwner"},
  2: {message:"NoActiveTx"},
  3: {message:"AlreadyPaid"},
  4: {message:"AlreadyCancelled"},
  5: {message:"TxNotFinished"},
  6: {message:"AmountMustBePositive"},
  7: {message:"WrongTokenSent"},
  8: {message:"Reentrant"},
  9: {message:"IndexOob"}
}

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init: ({owner}: {owner: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_active_transaction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_active_transaction: ({caller, amount, description, merchant_name, merchant_location, itemized_list, requested_token_contract}: {caller: string, amount: i128, description: string, merchant_name: string, merchant_location: string, itemized_list: string, requested_token_contract: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Transaction>>>

  /**
   * Construct and simulate a cancel_active_transaction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_active_transaction: ({caller}: {caller: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a pay_active_transaction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pay_active_transaction: ({payer}: {payer: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a clear_active_transaction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  clear_active_transaction: ({caller}: {caller: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_contract_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_contract_balance: ({token_contract}: {token_contract: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_payment_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_payment_status: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [boolean, Option<string>, boolean, Option<string>]>>

  /**
   * Construct and simulate a get_active_transaction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_active_transaction: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<Transaction>>>

  /**
   * Construct and simulate a get_recent_transactions_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_recent_transactions_count: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_recent_transaction_at transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_recent_transaction_at: ({index}: {index: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Transaction>>>

  /**
   * Construct and simulate a get_all_recent_transactions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_all_recent_transactions: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<Transaction>>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  withdraw: ({caller, to, token_contract}: {caller: string, to: string, token_contract: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<i128>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAC1RyYW5zYWN0aW9uAAAAAAsAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAJY2FuY2VsbGVkAAAAAAAAAQAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAACaWQAAAAAAAYAAAAAAAAADWl0ZW1pemVkX2xpc3QAAAAAAAAQAAAAAAAAABFtZXJjaGFudF9sb2NhdGlvbgAAAAAAABAAAAAAAAAADW1lcmNoYW50X25hbWUAAAAAAAAQAAAAAAAAAARwYWlkAAAAAQAAAAAAAAAFcGF5ZXIAAAAAAAPoAAAAEwAAAAAAAAAYcmVxdWVzdGVkX3Rva2VuX2NvbnRyYWN0AAAAEwAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
        "AAAABAAAAAAAAAAAAAAAA0VycgAAAAAJAAAAAAAAAAhOb3RPd25lcgAAAAEAAAAAAAAACk5vQWN0aXZlVHgAAAAAAAIAAAAAAAAAC0FscmVhZHlQYWlkAAAAAAMAAAAAAAAAEEFscmVhZHlDYW5jZWxsZWQAAAAEAAAAAAAAAA1UeE5vdEZpbmlzaGVkAAAAAAAABQAAAAAAAAAUQW1vdW50TXVzdEJlUG9zaXRpdmUAAAAGAAAAAAAAAA5Xcm9uZ1Rva2VuU2VudAAAAAAABwAAAAAAAAAJUmVlbnRyYW50AAAAAAAACAAAAAAAAAAISW5kZXhPb2IAAAAJ",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAWc2V0X2FjdGl2ZV90cmFuc2FjdGlvbgAAAAAABwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAADW1lcmNoYW50X25hbWUAAAAAAAAQAAAAAAAAABFtZXJjaGFudF9sb2NhdGlvbgAAAAAAABAAAAAAAAAADWl0ZW1pemVkX2xpc3QAAAAAAAAQAAAAAAAAABhyZXF1ZXN0ZWRfdG9rZW5fY29udHJhY3QAAAATAAAAAQAAA+kAAAfQAAAAC1RyYW5zYWN0aW9uAAAAB9AAAAADRXJyAA==",
        "AAAAAAAAAAAAAAAZY2FuY2VsX2FjdGl2ZV90cmFuc2FjdGlvbgAAAAAAAAEAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAA0VycgA=",
        "AAAAAAAAAAAAAAAWcGF5X2FjdGl2ZV90cmFuc2FjdGlvbgAAAAAAAQAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAADRXJyAA==",
        "AAAAAAAAAAAAAAAYY2xlYXJfYWN0aXZlX3RyYW5zYWN0aW9uAAAAAQAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAADRXJyAA==",
        "AAAAAAAAAAAAAAAUZ2V0X2NvbnRyYWN0X2JhbGFuY2UAAAABAAAAAAAAAA50b2tlbl9jb250cmFjdAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAASZ2V0X3BheW1lbnRfc3RhdHVzAAAAAAAAAAAAAQAAA+0AAAAEAAAAAQAAA+gAAAATAAAAAQAAA+gAAAAT",
        "AAAAAAAAAAAAAAAWZ2V0X2FjdGl2ZV90cmFuc2FjdGlvbgAAAAAAAAAAAAEAAAPoAAAH0AAAAAtUcmFuc2FjdGlvbgA=",
        "AAAAAAAAAAAAAAAdZ2V0X3JlY2VudF90cmFuc2FjdGlvbnNfY291bnQAAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAZZ2V0X3JlY2VudF90cmFuc2FjdGlvbl9hdAAAAAAAAAEAAAAAAAAABWluZGV4AAAAAAAABAAAAAEAAAPpAAAH0AAAAAtUcmFuc2FjdGlvbgAAAAfQAAAAA0VycgA=",
        "AAAAAAAAAAAAAAAbZ2V0X2FsbF9yZWNlbnRfdHJhbnNhY3Rpb25zAAAAAAAAAAABAAAD6gAAB9AAAAALVHJhbnNhY3Rpb24A",
        "AAAAAAAAAAAAAAAId2l0aGRyYXcAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAA50b2tlbl9jb250cmFjdAAAAAAAEwAAAAEAAAPpAAAACwAAB9AAAAADRXJyAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        set_active_transaction: this.txFromJSON<Result<Transaction>>,
        cancel_active_transaction: this.txFromJSON<Result<void>>,
        pay_active_transaction: this.txFromJSON<Result<void>>,
        clear_active_transaction: this.txFromJSON<Result<void>>,
        get_contract_balance: this.txFromJSON<i128>,
        get_payment_status: this.txFromJSON<readonly [boolean, Option<string>, boolean, Option<string>]>,
        get_active_transaction: this.txFromJSON<Option<Transaction>>,
        get_recent_transactions_count: this.txFromJSON<u32>,
        get_recent_transaction_at: this.txFromJSON<Result<Transaction>>,
        get_all_recent_transactions: this.txFromJSON<Array<Transaction>>,
        withdraw: this.txFromJSON<Result<i128>>
  }
}