/**
 * Verify an ICP Ledger transfer block before applying a cycle top-up.
 * Uses mainnet ICP Ledger (ryjl3-tyaaa-aaaaa-aaaba-cai) query_blocks.
 *
 * Env:
 *   LAUNCHPAD_LEDGER_HOST — default https://icp0.io
 *   LAUNCHPAD_LEDGER_CANISTER_ID — default ryjl3-tyaaa-aaaaa-aaaba-cai
 *   LAUNCHPAD_LEDGER_DEPOSIT_ACCOUNT_HEX — required: 64 hex chars (32-byte AccountIdentifier)
 *   LAUNCHPAD_MIN_DEPOSIT_E8S — default 10000 (0.0001 ICP)
 */
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "./icp-ledger.did.js";

const LEDGER_MAINNET = "ryjl3-tyaaa-aaaaa-aaaba-cai";

function hexToBytes(hex) {
  const h = String(hex || "").trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(h)) {
    throw new Error("LAUNCHPAD_LEDGER_DEPOSIT_ACCOUNT_HEX must be 64 hex chars (32 bytes)");
  }
  return Uint8Array.from(h.match(/.{2}/g).map((b) => Number.parseInt(b, 16)));
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Candid may decode AccountIdentifier as Uint8Array or {0:n,1:n,...}. */
function normalizeAccountBlob(to) {
  if (to instanceof Uint8Array) return to;
  if (Array.isArray(to)) return Uint8Array.from(to);
  if (to && typeof to === "object") {
    const keys = Object.keys(to)
      .map((k) => Number(k))
      .filter((k) => !Number.isNaN(k))
      .sort((a, b) => a - b);
    if (keys.length === 32) {
      return Uint8Array.from(keys.map((k) => to[k]));
    }
  }
  throw new Error("Invalid ledger AccountIdentifier blob");
}

/**
 * @param {object} opts
 * @param {string} opts.blockIndexTxHash — decimal block index (passed as tx_hash from client)
 * @param {string} opts.expectedMemoNat — decimal string from intent.memo_nat
 * @param {bigint} [opts.minE8s]
 */
export async function verifyIcpLedgerTransfer(opts) {
  const host = (process.env.LAUNCHPAD_LEDGER_HOST || "https://icp0.io").trim();
  const canisterId = (process.env.LAUNCHPAD_LEDGER_CANISTER_ID || LEDGER_MAINNET).trim();
  const depositHex = (process.env.LAUNCHPAD_LEDGER_DEPOSIT_ACCOUNT_HEX || "").trim();
  if (!depositHex) {
    throw new Error("LAUNCHPAD_LEDGER_DEPOSIT_ACCOUNT_HEX is required when ledger verify is enabled");
  }
  const minE8s = BigInt(process.env.LAUNCHPAD_MIN_DEPOSIT_E8S || "10000");

  const idxStr = String(opts.blockIndexTxHash || "").trim();
  if (!/^\d+$/.test(idxStr)) {
    throw new Error("tx_hash must be the ICP Ledger block index (decimal digits only)");
  }
  const start = BigInt(idxStr);
  const depositExpected = hexToBytes(depositHex);
  const expectedMemo = BigInt(String(opts.expectedMemoNat || "0"));

  const agent = new HttpAgent({ host });
  const ledger = Actor.createActor(idlFactory, {
    canisterId,
    agent,
  });

  const res = await ledger.query_blocks({
    start,
    length: BigInt(1),
  });

  const blocks = res?.blocks ?? [];
  if (!blocks.length) {
    throw new Error(
      "Ledger returned no blocks for this index (archived or pruned). Try a recent block or extend verification.",
    );
  }

  const block = blocks[0];
  const tx = block?.transaction;
  const rawOp = tx?.operation;
  const opInner = Array.isArray(rawOp) ? rawOp[0] : rawOp;
  const op = opInner && typeof opInner === "object" ? opInner : null;
  if (!op?.Transfer) {
    throw new Error("Block does not contain a Transfer operation");
  }

  const toU8 = normalizeAccountBlob(op.Transfer.to);
  if (!bytesEqual(toU8, depositExpected)) {
    throw new Error("Transfer destination does not match LAUNCHPAD_LEDGER_DEPOSIT_ACCOUNT_HEX");
  }

  const rawE8s = op.Transfer.amount?.e8s;
  const e8s = BigInt(
    typeof rawE8s === "bigint" ? rawE8s : String(rawE8s ?? "0"),
  );
  if (e8s < minE8s) {
    throw new Error(`Transfer amount ${e8s} e8s is below minimum ${minE8s}`);
  }

  const memo = tx.memo;
  const memoNat = BigInt(typeof memo === "bigint" ? memo : String(memo ?? "0"));
  if (memoNat !== expectedMemo) {
    throw new Error("Transfer memo does not match intent memo_nat (use exact memo from top-up intent)");
  }

  return {
    ok: true,
    block_index: idxStr,
    amount_e8s: e8s.toString(),
    memo: memoNat.toString(),
  };
}
