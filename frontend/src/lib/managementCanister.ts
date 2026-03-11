/**
 * Management canister interface for canister_status.
 * Caller must be a controller of the canister to use these.
 */
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

const MANAGEMENT_CANISTER_ID = Principal.fromText("aaaaa-aa");

export type CanisterStatus =
  | { running: null }
  | { stopping: null }
  | { stopped: null };

export interface CanisterStatusResult {
  status: CanisterStatus;
  memory_size: bigint;
  cycles: bigint;
  idle_cycles_burned_per_day: bigint;
  module_hash: [] | [Uint8Array];
  controllers: Principal[];
}

const MANAGEMENT_IDL = IDL.Service({
  canister_status: IDL.Func(
    [IDL.Record({ canister_id: IDL.Principal })],
    IDL.Record({
      status: IDL.Variant({
        running: IDL.Null,
        stopping: IDL.Null,
        stopped: IDL.Null,
      }),
      memory_size: IDL.Nat,
      cycles: IDL.Nat,
      idle_cycles_burned_per_day: IDL.Nat,
      module_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
      controllers: IDL.Vec(IDL.Principal),
    }),
    ["query"]
  ),
});

type ManagementActor = {
  canister_status: (arg: { canister_id: Principal }) => Promise<CanisterStatusResult>;
};

export async function getCanisterStatus(
  agent: HttpAgent,
  canisterId: string
): Promise<CanisterStatusResult | null> {
  try {
    const actor = Actor.createActor(MANAGEMENT_IDL, {
      agent,
      canisterId: MANAGEMENT_CANISTER_ID,
    }) as ManagementActor;
    return await actor.canister_status({
      canister_id: Principal.fromText(canisterId),
    });
  } catch {
    return null;
  }
}
