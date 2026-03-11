/**
 * Launchpad Registry — Register and list canisters per owner (for UI and Cursor).
 */
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Time "mo:base/Time";

persistent actor LaunchpadRegistry {

  public type CanisterInfo = {
    id : Principal;
    name : Text;
    owner : Principal;
    created_at : Int;
    network : Text; // "local" | "ic"
  };

  private transient let byId = HashMap.HashMap<Principal, CanisterInfo>(20, Principal.equal, Principal.hash);
  private transient let byOwner = HashMap.HashMap<Principal, [Principal]>(10, Principal.equal, Principal.hash);

  private func ensureOwnerList(owner : Principal) : [Principal] {
    switch (byOwner.get(owner)) {
      case null { [] };
      case (?list) { list };
    };
  };

  private func setOwnerList(owner : Principal, list : [Principal]) {
    byOwner.put(owner, list);
  };

  /// Register a canister (id, name, network). Caller becomes owner.
  public shared ({ caller }) func register(
    canister_id : Principal,
    name : Text,
    network : Text
  ) : async { #ok; #err : Text } {
    if (name == "") return #err "Name cannot be empty";
    if (Option.isSome(byId.get(canister_id))) {
      return #err "Canister already registered";
    };
    let info : CanisterInfo = {
      id = canister_id;
      name = name;
      owner = caller;
      created_at = Time.now();
      network = network;
    };
    byId.put(canister_id, info);
    let list = Array.append(ensureOwnerList(caller), [canister_id]);
    setOwnerList(caller, list);
    #ok;
  };

  /// Unregister (only owner).
  public shared ({ caller }) func unregister(canister_id : Principal) : async { #ok; #err : Text } {
    switch (byId.get(canister_id)) {
      case null { #err "Canister not found" };
      case (?info) {
        if (info.owner != caller) {
          return #err "Not the owner";
        };
        byId.delete(canister_id);
        let list = Array.filter(ensureOwnerList(caller), func (p : Principal) : Bool { p != canister_id });
        setOwnerList(caller, list);
        #ok;
      };
    };
  };

  /// Update name (only owner).
  public shared ({ caller }) func update_name(canister_id : Principal, name : Text) : async { #ok; #err : Text } {
    if (name == "") return #err "Name cannot be empty";
    switch (byId.get(canister_id)) {
      case null { #err "Canister not found" };
      case (?info) {
        if (info.owner != caller) return #err "Not the owner";
        byId.put(canister_id, { info with name });
        #ok;
      };
    };
  };

  /// List all canisters owned by the caller.
  public shared query ({ caller }) func list_mine() : async [CanisterInfo] {
    let ids = ensureOwnerList(caller);
    Array.mapFilter(ids, func (id : Principal) : ?CanisterInfo { byId.get(id) });
  };

  /// List all registered canisters (for personal Launchpad; allows II principal to see canisters registered by dfx identity).
  public shared query func list_all() : async [CanisterInfo] {
    Iter.toArray(byId.vals());
  };

  /// Get one canister by id (if caller is owner or public read - we allow read for any caller for simplicity).
  public shared query func get(canister_id : Principal) : async ?CanisterInfo {
    byId.get(canister_id);
  };
}
