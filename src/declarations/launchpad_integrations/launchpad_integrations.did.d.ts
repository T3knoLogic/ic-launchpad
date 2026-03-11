import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface LinkedAccount {
  'username' : string,
  'provider' : string,
  'external_id' : string,
}
/**
 * / * Launchpad Integrations — Link external accounts (Google, X, Instagram, etc.) to a principal.
 */
export interface _SERVICE {
  /**
   * / Link an external account. Replaces existing link for same provider.
   */
  'link' : ActorMethod<
    [string, string, string],
    { 'ok' : null } |
      { 'err' : string }
  >,
  /**
   * / List all linked accounts for the caller.
   */
  'list_mine' : ActorMethod<[], Array<LinkedAccount>>,
  /**
   * / Unlink by provider name.
   */
  'unlink' : ActorMethod<[string], { 'ok' : null } | { 'err' : string }>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
