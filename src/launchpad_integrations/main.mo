/**
 * Launchpad Integrations — Link external accounts (Google, X, Instagram, etc.) to a principal.
 */
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Text "mo:base/Text";

persistent actor LaunchpadIntegrations {

  public type LinkedAccount = {
    provider : Text;
    external_id : Text;
    username : Text;
  };

  private transient let byOwner = HashMap.HashMap<Principal, [LinkedAccount]>(10, Principal.equal, Principal.hash);

  private func ensureList(owner : Principal) : [LaunchpadIntegrations.LinkedAccount] {
    switch (byOwner.get(owner)) {
      case null { [] };
      case (?list) { list };
    };
  };

  /// Link an external account. Replaces existing link for same provider.
  public shared ({ caller }) func link(provider : Text, external_id : Text, username : Text) : async { #ok; #err : Text } {
    if (provider == "" or external_id == "") return #err "provider and external_id required";
    let list = Array.filter(ensureList(caller), func (a : LinkedAccount) : Bool { a.provider != provider });
    byOwner.put(caller, Array.append(list, [{ provider = provider; external_id = external_id; username = username }]));
    #ok;
  };

  /// Unlink by provider name.
  public shared ({ caller }) func unlink(provider : Text) : async { #ok; #err : Text } {
    let list = Array.filter(ensureList(caller), func (a : LinkedAccount) : Bool { a.provider != provider });
    byOwner.put(caller, list);
    #ok;
  };

  /// List all linked accounts for the caller.
  public shared query ({ caller }) func list_mine() : async [LaunchpadIntegrations.LinkedAccount] {
    ensureList(caller);
  };
}
