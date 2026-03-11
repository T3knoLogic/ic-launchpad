/**
 * Launchpad Wallet — Hold cycles, create canisters, top up canisters.
 * Accept cycles via wallet_receive or deposit(); controllers can create_canister and top_up.
 */
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import IC "ic:aaaaa-aa";

persistent actor LaunchpadWallet {

  /// Accept cycles into this canister (standard wallet_receive).
  public func wallet_receive() : async { accepted : Nat64 } {
    let amount = Cycles.available();
    let accepted = Cycles.accept(amount);
    { accepted = Nat64.fromNat(accepted) };
  };

  /// Deposit cycles from the caller (attach cycles to this call).
  public func deposit() : async { accepted : Nat } {
    let amount = Cycles.available();
    let accepted = Cycles.accept(amount);
    { accepted };
  };

  /// Current cycle balance of this canister.
  public shared query func get_balance() : async Nat {
    Cycles.balance();
  };

  type CreateResult = { #ok : Principal; #err : Text };

  /// Create a new canister with the given cycles. Caller must be a controller of this canister.
  public shared ({ caller }) func create_canister_with_cycles(
    amount : Nat,
    controllers : ?[Principal]
  ) : async CreateResult {
    if (Cycles.balance() < amount) {
      let msg = "Insufficient cycles. Balance: " # Nat.toText(Cycles.balance()) # ", required: " # Nat.toText(amount);
      return #err msg;
    };
    let self = Principal.fromActor(LaunchpadWallet);
    let ctrls = switch (controllers) {
      case (?c) { c };
      case null { [caller, self] };
    };
    Cycles.add(amount);
    try {
      let { canister_id } = await IC.create_canister({
        sender_canister_version = null;
        settings = ?{
          controllers = ?ctrls;
          freezing_threshold = ?31_557_600;
          memory_allocation = null;
          compute_allocation = null;
          log_visibility = null;
          reserved_cycles_limit = null;
          wasm_memory_limit = null;
          wasm_memory_threshold = null;
        };
      });
      return #ok canister_id;
    } catch (e) {
      let refund = Cycles.refunded();
      if (refund > 0) { Cycles.add(refund); };
      return #err "Create failed";
    };
  };

  type TopUpResult = { #ok; #err : Text };

  /// Top up a canister with cycles from this wallet. Caller must be a controller.
  public shared ({ caller }) func top_up(canister_id : Principal, amount : Nat) : async TopUpResult {
    if (Cycles.balance() < amount) {
      let msg = "Insufficient cycles. Balance: " # Nat.toText(Cycles.balance());
      return #err msg;
    };
    Cycles.add(amount);
    try {
      await IC.deposit_cycles({ canister_id });
      return #ok;
    } catch (e) {
      let refund = Cycles.refunded();
      if (refund > 0) { Cycles.add(refund); };
      return #err "Top-up failed";
    };
  };

  /// This canister's principal.
  public shared query func whoami() : async Principal {
    Principal.fromActor(LaunchpadWallet);
  };
}
