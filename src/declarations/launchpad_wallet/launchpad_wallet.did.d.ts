import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type CreateResult = { 'ok' : Principal } |
  { 'err' : string };
export type TopUpResult = { 'ok' : null } |
  { 'err' : string };
/**
 * / * Launchpad Wallet — Hold cycles, create canisters, top up canisters.
 * /  * Accept cycles via wallet_receive or deposit(); controllers can create_canister and top_up.
 */
export interface _SERVICE {
  /**
   * / Create a new canister with the given cycles. Caller must be a controller of this canister.
   */
  'create_canister_with_cycles' : ActorMethod<
    [bigint, [] | [Array<Principal>]],
    CreateResult
  >,
  /**
   * / Deposit cycles from the caller (attach cycles to this call).
   */
  'deposit' : ActorMethod<[], { 'accepted' : bigint }>,
  /**
   * / Current cycle balance of this canister.
   */
  'get_balance' : ActorMethod<[], bigint>,
  /**
   * / Top up a canister with cycles from this wallet. Caller must be a controller.
   */
  'top_up' : ActorMethod<[Principal, bigint], TopUpResult>,
  /**
   * / Accept cycles into this canister (standard wallet_receive).
   */
  'wallet_receive' : ActorMethod<[], { 'accepted' : bigint }>,
  /**
   * / This canister's principal.
   */
  'whoami' : ActorMethod<[], Principal>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
