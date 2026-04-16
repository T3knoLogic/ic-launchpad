/**
 * Verify Internet-Computer delegation chains and challenge signatures for Launchpad auth.
 */
import { requestIdOf } from "@dfinity/agent";
import {
  DelegationChain,
  Ed25519KeyIdentity,
  Ed25519PublicKey,
  isDelegationValid,
} from "@dfinity/identity";
import { Principal } from "@dfinity/principal";

const domainSeparator = new TextEncoder().encode("\x1aic-request-auth-delegation");

/**
 * @param {import('@dfinity/identity').Delegation} delegation
 */
function authDelegationChallenge(delegation) {
  return new Uint8Array([
    ...domainSeparator,
    ...new Uint8Array(requestIdOf(Object.assign({}, delegation))),
  ]);
}

/**
 * @param {DelegationChain} chain
 */
export function verifyDelegationChainSignatures(chain) {
  let signerPk = Ed25519PublicKey.from(chain.publicKey);
  for (const sd of chain.delegations) {
    const ch = authDelegationChallenge(sd.delegation);
    const ok = Ed25519KeyIdentity.verify(sd.signature, ch, signerPk.toRaw());
    if (!ok) return false;
    signerPk = Ed25519PublicKey.from(sd.delegation.pubkey);
  }
  return true;
}

/**
 * Leaf session key (last delegatee) used to sign the auth challenge.
 * @param {DelegationChain} chain
 */
export function leafSessionPublicKey(chain) {
  const last = chain.delegations[chain.delegations.length - 1];
  if (!last) throw new Error("Empty delegation chain");
  return Ed25519PublicKey.from(last.delegation.pubkey);
}

/**
 * Principal for the wallet identity (root public key in the chain).
 * @param {DelegationChain} chain
 */
export function principalFromDelegationChain(chain) {
  return Principal.selfAuthenticating(new Uint8Array(chain.publicKey));
}

/**
 * @param {object} input
 * @param {unknown} input.delegation_chain — JSON from DelegationChain.toJSON()
 * @param {string} input.challenge_text — UTF-8 challenge string from Launchpad
 * @param {string} input.challenge_signature_b64 — Ed25519 signature (raw 64 bytes) over challenge bytes
 * @param {string} input.expected_principal — Principal text from client
 */
export function verifyLaunchpadDelegationAuth(input) {
  const chain = DelegationChain.fromJSON(input.delegation_chain);
  if (!isDelegationValid(chain)) {
    return { ok: false, error: "Delegation expired or invalid scope" };
  }
  if (!verifyDelegationChainSignatures(chain)) {
    return { ok: false, error: "Invalid delegation chain signatures" };
  }
  const expected = principalFromDelegationChain(chain);
  if (expected.toText() !== input.expected_principal) {
    return { ok: false, error: "Delegation principal mismatch" };
  }
  const leaf = leafSessionPublicKey(chain);
  const msg = Buffer.from(String(input.challenge_text || ""), "utf8");
  const sig = Buffer.from(String(input.challenge_signature_b64 || ""), "base64");
  if (!Ed25519KeyIdentity.verify(sig, msg, leaf.toRaw())) {
    return { ok: false, error: "Invalid challenge signature" };
  }
  return { ok: true, chain };
}
