/**
 * Format cycles for display. Inspired by nns-dapp / oisy-wallet / plug patterns.
 */

export function formatCycles(n: bigint | null, opts?: { compact?: boolean; suffix?: boolean }): string {
  if (n === null) return "—";
  const suffix = opts?.suffix !== false;
  const compact = opts?.compact ?? true;
  const num = Number(n);
  if (num === 0) return suffix ? "0 cycles" : "0";
  if (compact && num >= 1e15) {
    const t = (num / 1e12).toFixed(2);
    return suffix ? `${t} T cycles` : `${t} T`;
  }
  if (compact && num >= 1e12) {
    const t = (num / 1e12).toFixed(2);
    return suffix ? `${t} T cycles` : `${t} T`;
  }
  if (compact && num >= 1e9) {
    const g = (num / 1e9).toFixed(2);
    return suffix ? `${g} G cycles` : `${g} G`;
  }
  const s = n.toString();
  if (s.length > 9) {
    const formatted = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return suffix ? `${formatted} cycles` : formatted;
  }
  return suffix ? `${s} cycles` : s;
}
