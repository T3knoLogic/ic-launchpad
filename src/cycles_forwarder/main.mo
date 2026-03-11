/**
 * Minimal cycles forwarder — install on empty canister to recover cycles.
 * Controllers can call forward_cycles(to, amount) to send cycles out.
 */
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import IC "ic:aaaaa-aa";

persistent actor CyclesForwarder {
  /// Forward cycles to another canister. Caller must be a controller.
  public shared func forward_cycles(to : Principal, amount : Nat) : async { #ok; #err : Text } {
    if (Cycles.balance() < amount) {
      return #err ("Insufficient cycles. Balance: " # Nat.toText(Cycles.balance()));
    };
    Cycles.add<system>(amount);
    try {
      await IC.deposit_cycles({ canister_id = to });
      #ok
    } catch (e) {
      let refund = Cycles.refunded();
      if (refund > 0) { Cycles.add<system>(refund); };
      #err "Transfer failed"
    }
  };

  /// Current balance (for verification).
  public shared query func get_balance() : async Nat {
    Cycles.balance()
  };
}
