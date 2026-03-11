import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CanisterInfo {
  'id' : Principal,
  'owner' : Principal,
  'name' : string,
  'network' : string,
  'created_at' : bigint,
}
/**
 * / * Launchpad Registry — Register and list canisters per owner (for UI and Cursor).
 */
export interface _SERVICE {
  /**
   * / Get one canister by id (if caller is owner or public read - we allow read for any caller for simplicity).
   */
  'get' : ActorMethod<[Principal], [] | [CanisterInfo]>,
  /**
   * / List all registered canisters (for personal Launchpad; allows II principal to see canisters registered by dfx identity).
   */
  'list_all' : ActorMethod<[], Array<CanisterInfo>>,
  /**
   * / List all canisters owned by the caller.
   */
  'list_mine' : ActorMethod<[], Array<CanisterInfo>>,
  /**
   * / Register a canister (id, name, network). Caller becomes owner.
   */
  'register' : ActorMethod<
    [Principal, string, string],
    { 'ok' : null } |
      { 'err' : string }
  >,
  /**
   * / Unregister (only owner).
   */
  'unregister' : ActorMethod<[Principal], { 'ok' : null } | { 'err' : string }>,
  /**
   * / Update name (only owner).
   */
  'update_name' : ActorMethod<
    [Principal, string],
    { 'ok' : null } |
      { 'err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
